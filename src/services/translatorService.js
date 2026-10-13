import { CURATED_CLASSROOM_PHRASES, CURATED_STUDENT_SANTHALI_PHRASES } from '../data/curatedPhrases.js';
import { containsOlChikiScript } from '../utils/olChikiTransliterator.js';

/**
 * Normalizes text for reliable semantic comparison:
 * - Trims whitespace
 * - Converts Latin to lowercase
 * - Strips Hindi & English punctuation marks (।, ., ,, !, ?, :, -, ", ', etc.)
 * - Normalizes internal multiple spaces
 */
export const normalizeText = (str = '') => {
  return (str || '')
    .toLowerCase()
    .replace(/[।.,!?।\-_:;"'()[\]{}~`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Internal helper to query our backend `/api/translate` endpoint.
 * Note: `/api/translate` uses the unofficial Google Translate web endpoint
 * (`translate.googleapis.com/translate_a/single?client=gtx`) for prototype testing.
 * It is NOT an official Google Cloud API and may be rate-limited or stop working.
 */
async function callBackendTranslateApi({ text, sourceLang, targetLang }) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 9000);

  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text, sourceLang, targetLang }),
      signal: controller.signal
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data || !data.ok) {
      return {
        ok: false,
        errorCode: data?.errorCode || `HTTP_${response.status}`,
        message:
          data?.message ||
          `अनुवाद सेवा उपलब्ध नहीं है (HTTP ${response.status}). कृपया सत्यापित प्राइमर वाक्यों का उपयोग करें।`
      };
    }

    return { ok: true, data };
  } catch (err) {
    if (err.name === 'AbortError') {
      return {
        ok: false,
        errorCode: 'CLIENT_TIMEOUT',
        message: 'अनुवाद सेवा का समय समाप्त हो गया (Request timed out). कृपया अपना इंटरनेट कनेक्शन जांचें।'
      };
    }
    return {
      ok: false,
      errorCode: 'NETWORK_ERROR',
      message: 'बैकएंड अनुवाद एंडपॉइंट (/api/translate) से संपर्क नहीं हो सका। कृपया नेटवर्क जांचें या सत्यापित प्राइमर वाक्यों का उपयोग करें।'
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Translator Service for AkhraSiksha AI
 * 
 * Strict Accuracy & Transparency Architecture:
 * 1. First checks the curated classroom primer. Exact/variant matches return
 *    status: 'VERIFIED_PRIMER_MATCH' with isVerified: true.
 * 2. If not in the curated primer, requests machine translation via `/api/translate`.
 *    - Checks that the returned Santhali output actually contains Ol Chiki Unicode characters.
 *    - Explicitly states that a script check only confirms the writing system, NOT translation accuracy.
 *    - Returns status: 'MACHINE_TRANSLATED_UNVERIFIED' with isVerified: false and isMachineTranslated: true.
 *    - Clearly labels automatic pronunciation guides as approximations.
 * 3. If `/api/translate` fails (network error, rate limit, or script check failure),
 *    it NEVER invents a translation and falls back honestly to NOT_IN_CURATED_PRIMER.
 */

export const translateHindiToTribal = async ({
  text,
  targetLanguageCode = 'sat'
}) => {
  const trimmed = (text || '').trim();
  if (!trimmed) {
    throw new Error('कृपया अनुवाद के लिए कोई हिंदी वाक्य दर्ज करें (Please enter a Hindi classroom sentence).');
  }

  if (targetLanguageCode !== 'sat') {
    return {
      status: 'ROADMAP_PREVIEW',
      isVerified: false,
      isMachineTranslated: false,
      sourceLanguage: 'Hindi (हिंदी)',
      targetLanguage: targetLanguageCode,
      message: 'इस जनजातीय भाषा के प्राइमर पर कार्य प्रगति पर है। वर्तमान में केवल संथाली (Santhali — sat) समर्थित है।'
    };
  }

  const normalizedInput = normalizeText(trimmed);

  // 1. Exact or strict variant match against verified classroom primer
  const matchedPhrase = CURATED_CLASSROOM_PHRASES.find(phrase => {
    const normMain = normalizeText(phrase.hindi);
    const normShort = normalizeText(phrase.shortHindi);

    if (normalizedInput === normMain || normalizedInput === normShort) {
      return true;
    }

    if (phrase.validVariants && phrase.validVariants.length > 0) {
      return phrase.validVariants.some(v => normalizeText(v) === normalizedInput);
    }

    return false;
  });

  if (matchedPhrase) {
    return {
      status: 'VERIFIED_PRIMER_MATCH',
      isVerified: true,
      isMachineTranslated: false,
      phraseId: matchedPhrase.id,
      category: matchedPhrase.category,
      hindiInput: trimmed,
      matchedStandardHindi: matchedPhrase.hindi,
      english: matchedPhrase.english,
      santhaliOlChiki: matchedPhrase.santhaliOlChiki,
      santhaliRoman: matchedPhrase.santhaliRoman,
      santhaliDevanagari: matchedPhrase.santhaliDevanagari,
      isPronunciationApproximation: false,
      teacherTip: matchedPhrase.teacherTip,
      difficulty: matchedPhrase.difficulty,
      sourceAttribution: 'Authentic Santhali MLE Primary Educational Primer (Ol Chiki)',
      verificationBadge: 'Verified Classroom Primer'
    };
  }

  // 2. Not in curated primer -> Attempt live machine translation via backend `/api/translate`
  const apiResult = await callBackendTranslateApi({
    text: trimmed,
    sourceLang: 'hi',
    targetLang: 'sat'
  });

  if (apiResult.ok && apiResult.data?.santhaliOlChiki) {
    const olChikiOutput = apiResult.data.santhaliOlChiki;
    const scriptVerified = containsOlChikiScript(olChikiOutput);

    if (scriptVerified) {
      return {
        status: 'MACHINE_TRANSLATED_UNVERIFIED',
        isVerified: false,
        isMachineTranslated: true,
        hindiInput: trimmed,
        santhaliOlChiki: olChikiOutput,
        hasOlChikiScript: true,
        scriptCheckNote:
          apiResult.data.scriptCheckNote ||
          'Ol Chiki script detected (Unicode U+1C50–U+1C7F). Note: Script detection confirms only the writing system, NOT translation accuracy.',
        santhaliRoman: apiResult.data.santhaliRoman || null,
        santhaliDevanagari: apiResult.data.santhaliDevanagari || null,
        isPronunciationApproximation: Boolean(apiResult.data.isPronunciationApproximation),
        pronunciationNote:
          apiResult.data.pronunciationNote ||
          'Automatic character-by-character phonetic approximation from Ol Chiki script (Unverified).',
        english: apiResult.data.englishApproximation || null,
        providerLabel:
          apiResult.data.providerLabel ||
          'Unofficial Google Translate Web Endpoint (Prototype Demo — Not an official Google Cloud API)',
        accuracyDisclaimer:
          apiResult.data.accuracyDisclaimer ||
          '⚠️ यह मशीन द्वारा जनित अपुष्ट (Unverified) अनुवाद है। यह एक अनधिकृत वेब एंडपॉइंट से प्राप्त किया गया है जो कभी भी काम करना बंद कर सकता है।',
        verificationBadge: 'Unverified Machine Translation (Prototype)'
      };
    }
  }

  // 3. Honest fallback when API is unreachable, rate-limited, or fails script check:
  // Do NOT invent or display an unrelated translation!
  return {
    status: 'NOT_IN_CURATED_PRIMER',
    isVerified: false,
    isMachineTranslated: false,
    hindiInput: trimmed,
    santhaliOlChiki: null,
    santhaliRoman: null,
    santhaliDevanagari: null,
    english: null,
    teacherTip: null,
    apiErrorCode: apiResult.errorCode || 'TRANSLATION_UNAVAILABLE',
    apiErrorMessage: apiResult.message || null,
    message: `वाक्य क्यूरेटेड प्राथमिक प्राइमर में उपलब्ध नहीं है और लाइव मशीन अनुवाद विफल रहा: "${trimmed}"`,
    explanation:
      apiResult.message ||
      `सटीकता सुरक्षा (Accuracy Safeguard): आपके द्वारा दर्ज किया गया वाक्य ("${trimmed}") प्राथमिक कक्षा प्राइमर शब्दकोश में शामिल नहीं है और मशीन अनुवाद सेवा उपलब्ध नहीं हो सकी। हम कोई मनगढ़ंत या असंबंधित अनुवाद नहीं दिखाते हैं।`,
    demoNotice:
      'Notice: Machine translation via /api/translate was unavailable or failed script verification. Curated sample phrases remain available below.',
    suggestedPhrases: CURATED_CLASSROOM_PHRASES.slice(0, 4)
  };
};

/**
 * Translate Student Santhali Speech / Text to Hindi
 */
export const translateSanthaliToHindi = async ({
  text
}) => {
  const trimmed = (text || '').trim();
  if (!trimmed) {
    throw new Error('कृपया अनुवाद के लिए संथाली वाक्य दर्ज करें या बोलें (Please enter or speak a Santhali sentence).');
  }

  const normalizedInput = normalizeText(trimmed);

  // 1. Strict match in student expressions
  let matchedStudent = CURATED_STUDENT_SANTHALI_PHRASES.find(phrase => {
    const normRoman = normalizeText(phrase.santhaliRoman);
    const normOlChiki = (phrase.santhaliOlChiki || '').trim();
    const normDev = (phrase.santhaliDevanagari || '').trim();

    if (normalizedInput === normRoman || trimmed === normOlChiki || trimmed === normDev) {
      return true;
    }

    if (phrase.validVariants && phrase.validVariants.length > 0) {
      return phrase.validVariants.some(v => normalizeText(v) === normalizedInput || v === trimmed);
    }

    return false;
  });

  if (matchedStudent) {
    return {
      status: 'VERIFIED_STUDENT_MATCH',
      isVerified: true,
      isMachineTranslated: false,
      santhaliInput: trimmed,
      santhaliOlChiki: matchedStudent.santhaliOlChiki,
      santhaliRoman: matchedStudent.santhaliRoman,
      santhaliDevanagari: matchedStudent.santhaliDevanagari,
      hindiTranslation: matchedStudent.hindi,
      englishMeaning: matchedStudent.english,
      teacherAdvice: matchedStudent.teacherAdvice,
      category: matchedStudent.category,
      verificationBadge: 'Verified Student Expression'
    };
  }

  // 2. Strict match in general classroom phrases
  let matchedGeneral = CURATED_CLASSROOM_PHRASES.find(phrase => {
    const normRoman = normalizeText(phrase.santhaliRoman);
    const normOlChiki = (phrase.santhaliOlChiki || '').trim();
    const normDev = (phrase.santhaliDevanagari || '').trim();

    return normalizedInput === normRoman || trimmed === normOlChiki || trimmed === normDev;
  });

  if (matchedGeneral) {
    return {
      status: 'VERIFIED_PRIMER_MATCH',
      isVerified: true,
      isMachineTranslated: false,
      santhaliInput: trimmed,
      santhaliOlChiki: matchedGeneral.santhaliOlChiki,
      santhaliRoman: matchedGeneral.santhaliRoman,
      santhaliDevanagari: matchedGeneral.santhaliDevanagari,
      hindiTranslation: matchedGeneral.hindi,
      englishMeaning: matchedGeneral.english,
      teacherAdvice: matchedGeneral.teacherTip,
      category: matchedGeneral.category,
      verificationBadge: 'Verified Classroom Primer'
    };
  }

  // 3. If the Santhali input is written in Ol Chiki script, try `/api/translate` (sat -> hi)
  if (containsOlChikiScript(trimmed)) {
    const apiResult = await callBackendTranslateApi({
      text: trimmed,
      sourceLang: 'sat',
      targetLang: 'hi'
    });

    if (apiResult.ok && apiResult.data?.hindiTranslation) {
      return {
        status: 'MACHINE_TRANSLATED_UNVERIFIED',
        isVerified: false,
        isMachineTranslated: true,
        santhaliInput: trimmed,
        santhaliOlChiki: trimmed,
        santhaliRoman: null,
        hindiTranslation: apiResult.data.hindiTranslation,
        englishMeaning: null,
        providerLabel:
          apiResult.data.providerLabel ||
          'Unofficial Google Translate Web Endpoint (Prototype Demo — Not an official Google Cloud API)',
        teacherAdvice:
          apiResult.data.accuracyDisclaimer ||
          '⚠️ यह मशीन द्वारा जनित अपुष्ट (Unverified) हिंदी अनुवाद है। यह एक अनधिकृत वेब एंडपॉइंट से प्राप्त किया गया है।',
        verificationBadge: 'Unverified Machine Translation (Prototype)'
      };
    }
  }

  // 4. Honest unverified fallback: Do NOT display an unrelated translation!
  return {
    status: 'NOT_IN_CURATED_PRIMER',
    isVerified: false,
    isMachineTranslated: false,
    santhaliInput: trimmed,
    santhaliOlChiki: trimmed,
    santhaliRoman: trimmed,
    hindiTranslation: null,
    englishMeaning: null,
    message: `संथाली वाक्य प्राथमिक प्राइमर में उपलब्ध नहीं है: "${trimmed}"`,
    teacherAdvice: 'यह संथाली वाक्य सत्यापित छात्र प्राइमर सूची में नहीं मिला। मनगढ़ंत या गलत अनुवाद से बचने के लिए, कृपया नीचे दिए गए सत्यापित छात्र वाक्यों में से चुनें या ओल चिकी (Ol Chiki) लिपि में संथाली वाक्य दर्ज करें।',
    demoNotice: 'Notice: This Roman/Devanagari Santhali phrase is not in the verified student primer.',
    suggestedPhrases: CURATED_STUDENT_SANTHALI_PHRASES.slice(0, 4)
  };
};
