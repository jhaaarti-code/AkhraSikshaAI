/**
 * Backend Translation Endpoint Handler (/api/translate) for AkhraSiksha AI
 *
 * IMPORTANT DOCUMENTATION & TRANSPARENCY:
 * 1. For this student hackathon prototype, this backend endpoint queries the
 *    UNOFFICIAL Google Translate web endpoint (`translate.googleapis.com/translate_a/single?client=gtx`).
 * 2. This is NOT an official Google Cloud Translation API. It is an undocumented,
 *    unofficial web endpoint without any service-level guarantee, and it may be
 *    rate-limited or stop working at any time.
 * 3. All translations returned by this endpoint are UNVERIFIED machine translations
 *    (`isVerified: false`, `isMachineTranslated: true`).
 * 4. Checking that the output uses Ol Chiki Unicode characters (U+1C50..U+1C7F)
 *    verifies ONLY the writing system (script), NOT semantic or linguistic accuracy.
 * 5. If the request fails, times out, or is rate-limited, this endpoint NEVER
 *    invents or fabricates a translation.
 */

import {
  containsOlChikiScript,
  generateOlChikiPronunciationApproximation
} from '../src/utils/olChikiTransliterator.js';

const SUPPORTED_PAIRS = new Set(['hi->sat', 'sat->hi']);
const REQUEST_TIMEOUT_MS = 8000;
const MAX_TEXT_LENGTH = 500;

/**
 * Runtime in-memory cache of machine-translated outputs fetched from the
 * unofficial web endpoint to avoid duplicate network requests and rate limits.
 * Note: All cached entries are still returned as UNVERIFIED machine translations
 * (`isVerified: false`, `isMachineTranslated: true`).
 */
const translationCache = new Map();

const CHROME_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

/**
 * Helper to call the unofficial web translation endpoints with timeout protection.
 * Tries `translate.googleapis.com` (`client=gtx`) first, and if rate-limited (429),
 * tries `clients5.google.com` (`client=dict-chrome-ex`).
 */
async function fetchUnofficialWebTranslation({ text, sourceLang, targetLang }) {
  const normalizedKey = `${sourceLang}->${targetLang}:${text.trim()}`;
  if (translationCache.has(normalizedKey)) {
    return translationCache.get(normalizedKey);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const params = new URLSearchParams({
      client: 'gtx',
      sl: sourceLang,
      tl: targetLang,
      dt: 't',
      q: text
    });

    const gtxUrl = `https://translate.googleapis.com/translate_a/single?${params.toString()}`;
    const response = await fetch(gtxUrl, {
      method: 'GET',
      headers: {
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9,hi;q=0.8',
        'User-Agent': CHROME_USER_AGENT
      },
      signal: controller.signal
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translatedText = data[0]
          .map((segment) => (Array.isArray(segment) && segment[0] ? String(segment[0]) : ''))
          .join('')
          .trim();

        if (translatedText) {
          translationCache.set(normalizedKey, translatedText);
          return translatedText;
        }
      }
    }

    // Secondary unofficial web endpoint if primary returns 429 or unexpected format
    const altParams = new URLSearchParams({
      client: 'dict-chrome-ex',
      sl: sourceLang,
      tl: targetLang,
      q: text
    });
    const altUrl = `https://clients5.google.com/translate_a/t?${altParams.toString()}`;
    const altResponse = await fetch(altUrl, {
      method: 'GET',
      headers: {
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9,hi;q=0.8',
        'User-Agent': CHROME_USER_AGENT
      },
      signal: controller.signal
    });

    if (altResponse.ok) {
      const altData = await altResponse.json();
      let altTranslated = '';
      if (Array.isArray(altData) && typeof altData[0] === 'string') {
        altTranslated = altData[0].trim();
      } else if (Array.isArray(altData) && Array.isArray(altData[0])) {
        altTranslated = altData[0]
          .map((seg) => (Array.isArray(seg) && seg[0] ? String(seg[0]) : typeof seg === 'string' ? seg : ''))
          .join('')
          .trim();
      }

      if (altTranslated) {
        translationCache.set(normalizedKey, altTranslated);
        return altTranslated;
      }
    }

    if (altResponse.status === 429 || response.status === 429) {
      const err = new Error('अनधिकृत वेब अनुवाद सेवा की दर सीमा समाप्त हो गई है (HTTP 429: Rate limit reached on unofficial translation endpoint). कृपया कुछ समय बाद पुनः प्रयास करें या सत्यापित प्राइमर वाक्यों का उपयोग करें।');
      err.code = 'RATE_LIMIT_EXCEEDED';
      err.status = 429;
      throw err;
    }

    if (!altResponse.ok) {
      const err = new Error(`अनुवाद सेवा से त्रुटि प्राप्त हुई (Upstream HTTP ${altResponse.status}).`);
      err.code = 'UPSTREAM_HTTP_ERROR';
      err.status = 502;
      throw err;
    }

    const altData = await altResponse.json();
    let altTranslated = '';
    if (Array.isArray(altData) && typeof altData[0] === 'string') {
      altTranslated = altData[0].trim();
    } else if (Array.isArray(altData) && Array.isArray(altData[0])) {
      altTranslated = altData[0]
        .map((seg) => (Array.isArray(seg) && seg[0] ? String(seg[0]) : typeof seg === 'string' ? seg : ''))
        .join('')
        .trim();
    }

    if (!altTranslated) {
      const err = new Error('अनुवाद सेवा से अमान्य डेटा प्रारूप प्राप्त हुआ (Invalid response format from translation endpoint).');
      err.code = 'INVALID_UPSTREAM_RESPONSE';
      err.status = 502;
      throw err;
    }

    translationCache.set(normalizedKey, altTranslated);
    return altTranslated;
  } catch (err) {
    if (err.name === 'AbortError') {
      const timeoutErr = new Error('अनुवाद अनुरोध का समय समाप्त हो गया (Translation request timed out after 8 seconds). कृपया अपना इंटरनेट कनेक्शन जांचें।');
      timeoutErr.code = 'REQUEST_TIMEOUT';
      timeoutErr.status = 504;
      throw timeoutErr;
    }
    if (err.message === 'fetch failed' || err.name === 'TypeError') {
      const netErr = new Error('बैकएंड सर्वर बाहरी अनुवाद सेवा (translate.googleapis.com) से कनेक्ट नहीं हो सका (Network connection failed from local server). कृपया इंटरनेट कनेक्शन और सर्वर नेटवर्क अनुमति जांचें।');
      netErr.code = 'UPSTREAM_NETWORK_UNREACHABLE';
      netErr.status = 503;
      throw netErr;
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Core translation function used by both Vite dev middleware and standalone Node server.
 */
export async function processTranslationRequest({ text, sourceLang = 'hi', targetLang = 'sat' }) {
  const trimmed = typeof text === 'string' ? text.trim() : '';

  if (!trimmed) {
    return {
      httpStatus: 400,
      body: {
        ok: false,
        errorCode: 'EMPTY_INPUT',
        message: 'कृपया अनुवाद के लिए कोई वाक्य दर्ज करें (Please provide non-empty text to translate).'
      }
    };
  }

  if (trimmed.length > MAX_TEXT_LENGTH) {
    return {
      httpStatus: 400,
      body: {
        ok: false,
        errorCode: 'INPUT_TOO_LONG',
        message: `वाक्य बहुत लंबा है। कृपया ${MAX_TEXT_LENGTH} अक्षरों से कम का वाक्य दर्ज करें (Input exceeds ${MAX_TEXT_LENGTH} characters).`
      }
    };
  }

  const pairKey = `${sourceLang}->${targetLang}`;
  if (!SUPPORTED_PAIRS.has(pairKey)) {
    return {
      httpStatus: 400,
      body: {
        ok: false,
        errorCode: 'UNSUPPORTED_LANGUAGE_PAIR',
        message: `भाषा युग्म (${pairKey}) समर्थित नहीं है। वर्तमान में केवल हिंदी ➔ संथाली (hi->sat) और संथाली ➔ हिंदी (sat->hi) समर्थित हैं।`
      }
    };
  }

  try {
    const translatedText = await fetchUnofficialWebTranslation({
      text: trimmed,
      sourceLang,
      targetLang
    });

    if (!translatedText) {
      return {
        httpStatus: 502,
        body: {
          ok: false,
          errorCode: 'EMPTY_TRANSLATION',
          message: 'अनुवाद सेवा ने खाली उत्तर लौटाया (Translation service returned an empty result).'
        }
      };
    }

    // When translating Hindi -> Santhali, verify that the returned text actually uses Ol Chiki script
    if (targetLang === 'sat') {
      const hasOlChiki = containsOlChikiScript(translatedText);

      if (!hasOlChiki || translatedText === trimmed) {
        return {
          httpStatus: 422,
          body: {
            ok: false,
            errorCode: 'OL_CHIKI_SCRIPT_CHECK_FAILED',
            message: 'अनुवाद सेवा इस वाक्य के लिए ओल चिकी (Ol Chiki) लिपि में संथाली अनुवाद उत्पन्न नहीं कर सकी (Returned text was not in Ol Chiki script). गलत या अपुष्ट पाठ दिखाने के बजाय इसे रोक दिया गया है।'
          }
        };
      }

      // Generate approximate Roman & Devanagari pronunciation guides from Ol Chiki script
      const phonetics = generateOlChikiPronunciationApproximation(translatedText);

      return {
        httpStatus: 200,
        body: {
          ok: true,
          status: 'MACHINE_TRANSLATED_UNVERIFIED',
          isVerified: false,
          isMachineTranslated: true,
          sourceLang: 'hi',
          targetLang: 'sat',
          sourceText: trimmed,
          translatedText,
          santhaliOlChiki: translatedText,
          hasOlChikiScript: true,
          scriptCheckNote: 'Ol Chiki script detected (Unicode U+1C50–U+1C7F). Note: Script detection confirms only the writing system, NOT translation accuracy.',
          santhaliRoman: phonetics?.romanApproximation || null,
          santhaliDevanagari: phonetics?.devanagariApproximation || null,
          isPronunciationApproximation: Boolean(phonetics),
          pronunciationNote: phonetics?.approximationNote || 'Pronunciation approximation unavailable.',
          englishApproximation: null,
          providerLabel: 'Unofficial Google Translate Web Endpoint (Prototype Demo — Not an official Google Cloud API)',
          accuracyDisclaimer: '⚠️ यह मशीन द्वारा जनित अपुष्ट (Unverified) अनुवाद है। यह एक अनधिकृत वेब एंडपॉइंट से प्राप्त किया गया है जो कभी भी काम करना बंद कर सकता है। कक्षा में उपयोग से पहले स्थानीय संथाली वक्ता से इसकी पुष्टि करें।'
        }
      };
    }

    // When translating Santhali -> Hindi (sat -> hi)
    return {
      httpStatus: 200,
      body: {
        ok: true,
        status: 'MACHINE_TRANSLATED_UNVERIFIED',
        isVerified: false,
        isMachineTranslated: true,
        sourceLang: 'sat',
        targetLang: 'hi',
        sourceText: trimmed,
        translatedText,
        hindiTranslation: translatedText,
        providerLabel: 'Unofficial Google Translate Web Endpoint (Prototype Demo — Not an official Google Cloud API)',
        accuracyDisclaimer: '⚠️ यह मशीन द्वारा जनित अपुष्ट (Unverified) हिंदी अनुवाद है। यह एक अनधिकृत वेब एंडपॉइंट से प्राप्त किया गया है।'
      }
    };
  } catch (err) {
    const status = err.status || 503;
    const errorCode = err.code || 'NETWORK_OR_SERVICE_ERROR';
    const message =
      err.message ||
      'नेटवर्क या अनुवाद सेवा में समस्या के कारण मशीन अनुवाद उपलब्ध नहीं हो सका (Machine translation failed due to a network or service error). कृपया नीचे दिए गए सत्यापित प्राइमर वाक्यों का उपयोग करें।';

    return {
      httpStatus: status,
      body: {
        ok: false,
        errorCode,
        message
      }
    };
  }
}

/**
 * Node HTTP / Connect middleware for `/api/translate`
 */
export function createTranslateMiddleware() {
  return async (req, res, next) => {
    const urlPath = (req.url || '').split('?')[0];
    if (urlPath !== '/api/translate') {
      if (typeof next === 'function') return next();
      return;
    }

    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(
        JSON.stringify({
          ok: false,
          errorCode: 'METHOD_NOT_ALLOWED',
          message: 'Only POST requests are supported on /api/translate.'
        })
      );
      return;
    }

    let rawBody = '';
    req.on('data', (chunk) => {
      rawBody += chunk;
      if (rawBody.length > 10000) {
        req.destroy();
      }
    });

    req.on('end', async () => {
      let parsed = {};
      try {
        parsed = rawBody ? JSON.parse(rawBody) : {};
      } catch {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(
          JSON.stringify({
            ok: false,
            errorCode: 'INVALID_JSON',
            message: 'Request body must be valid JSON.'
          })
        );
        return;
      }

      const result = await processTranslationRequest({
        text: parsed.text,
        sourceLang: parsed.sourceLang || 'hi',
        targetLang: parsed.targetLang || 'sat'
      });

      res.statusCode = result.httpStatus;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify(result.body));
    });
  };
}
