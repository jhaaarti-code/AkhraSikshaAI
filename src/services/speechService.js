/**
 * Speech Synthesis Service for AkhraSiksha AI
 * Uses the Web Speech API (window.speechSynthesis).
 *
 * CRITICAL ANDROID CHROME & MOBILE STABILITY FEATURES:
 * 1. Synchronous execution: window.speechSynthesis.speak() is called directly within
 *    the synchronous user gesture stack (no setTimeout), satisfying mobile browser User Activation policies.
 * 2. Chromium / Android GC protection: The active utterance is stored on module scope AND window._activeSpeechUtterance
 *    to prevent Android Chrome's V8 engine from garbage-collecting the utterance before/during playback.
 * 3. Android Chrome paused state wakeup: window.speechSynthesis.resume() is called before and immediately after speak()
 *    to recover from Android's background paused state.
 * 4. Asynchronous voice handling: Listens to window.speechSynthesis.onvoiceschanged and caches voices immediately.
 *    If voices are still initializing when the user taps, falls back to setting utterance.lang ('hi-IN' or 'en-IN')
 *    so playback succeeds using the platform default engine rather than failing silently.
 * 5. Ol Chiki script safety: Unicode Ol Chiki script (U+1C50–U+1C7F) cannot be pronounced directly by browser TTS.
 *    The service automatically substitutes the Romanized pronunciation guide using an Indian English ('en-IN')
 *    or English fallback voice, clearly labeled as an approximation.
 */

import { containsOlChikiScript, generateOlChikiPronunciationApproximation } from '../utils/olChikiTransliterator.js';

// Module-level and window-level references to prevent Android Chrome V8 garbage collection
let activeUtterance = null;
let cachedVoices = [];
let voiceListeners = [];

const notifyVoiceListeners = (voices) => {
  voiceListeners.forEach((fn) => {
    try {
      fn(voices);
    } catch (_) {
      // Ignore listener error
    }
  });
};

const updateVoices = () => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      const list = window.speechSynthesis.getVoices();
      if (list && list.length > 0) {
        cachedVoices = list;
        notifyVoiceListeners(cachedVoices);
      }
    } catch (_) {
      // Ignore error
    }
  }
};

// Immediately initialize voices on script load in browser environments
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  updateVoices();
  try {
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
    window.speechSynthesis.addEventListener?.('voiceschanged', updateVoices);
  } catch (_) {
    // Ignore error
  }
}

/**
 * Returns available browser voices.
 * Uses cached voices if already loaded, otherwise queries speechSynthesis.getVoices().
 */
export const getAvailableVoices = () => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return [];
  }
  if (!cachedVoices || cachedVoices.length === 0) {
    updateVoices();
  }
  return cachedVoices.length > 0 ? cachedVoices : (window.speechSynthesis.getVoices() || []);
};

/**
 * Subscribes to voice list updates (essential for Android Chrome where voices load asynchronously).
 */
export const onVoicesLoaded = (callback) => {
  if (typeof callback !== 'function') return () => {};
  voiceListeners.push(callback);
  const current = getAvailableVoices();
  if (current.length > 0) {
    callback(current);
  }
  return () => {
    voiceListeners = voiceListeners.filter((fn) => fn !== callback);
  };
};

/**
 * Wait for voices to load asynchronously with a timeout fallback.
 */
export const waitForVoices = (timeoutMs = 1500) => {
  return new Promise((resolve) => {
    const voices = getAvailableVoices();
    if (voices && voices.length > 0) {
      resolve(voices);
      return;
    }
    let resolved = false;
    const cleanup = onVoicesLoaded((v) => {
      if (!resolved && v && v.length > 0) {
        resolved = true;
        clearTimeout(timer);
        cleanup();
        resolve(v);
      }
    });
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        cleanup();
        resolve(getAvailableVoices());
      }
    }, timeoutMs);
  });
};

/**
 * Checks whether the host device has a genuine native Santhali TTS voice.
 * IMPORTANT: Android OS / Google Speech Services exposes stub locale entries
 * (e.g. 'Santali India', 'sat-IN') in getVoices(), but DOES NOT provide an acoustic synthesis model
 * or voice assets for Santali. Attempting to synthesize with these stubs results in complete silence.
 * Therefore, native Santhali text-to-speech is treated as unsupported on Android Chrome & browsers.
 */
export const checkSanthaliVoiceSupport = (voicesList = null) => {
  return {
    isNativeSupported: false,
    nativeVoice: null,
    totalVoicesCount: (voicesList || getAvailableVoices()).length
  };
};

/**
 * Sanitizes Romanized phonetic text for English TTS engines.
 * Strips non-ASCII diacritics (e.g. ạ, ṛ, ḍ, ṭ, ñ, ẽ, õ) to plain ASCII equivalents
 * so Android Chrome / Google TTS text normalizers don't crash with synthesis-failed.
 */
export const sanitizeRomanForTTS = (text = '') => {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/[ạẠ]/g, 'a')
    .replace(/[ḍḌ]/g, 'd')
    .replace(/[ṭṬ]/g, 't')
    .replace(/[ṛṚ]/g, 'r')
    .replace(/[ñÑ]/g, 'n')
    .replace(/[ṇṆ]/g, 'n')
    .replace(/[ẽẼ]/g, 'e')
    .replace(/[õÕ]/g, 'o')
    .replace(/[ãÃ]/g, 'a')
    .replace(/[ĩĨ]/g, 'i')
    .replace(/[ũŨ]/g, 'u')
    .replace(/w̃/g, 'w')
    .replace(/[ᱰᱍ]/g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[~^`]/g, '')
    .trim();
};

/**
 * Selects the most suitable speech synthesis voice.
 *
 * For 'sat' (Santhali):
 * - Native Santhali voice synthesis is unavailable on Android/Chrome.
 * - Skips non-functional system stub voices (e.g. 'Santali India' with sat-IN) that produce silence.
 * - Selects a functional fallback engine to read the pronunciation guide:
 *   1. Indian English ('en-IN') for Romanized guide.
 *   2. Standard English ('en-US', 'en-GB', etc.) for Romanized guide.
 *   3. If only Hindi voices exist on the device, selects Hindi ('hi-IN') with Devanagari guide.
 *   4. System default voice (excluding sat stubs).
 *
 * For 'hi' (Hindi):
 * - Selects native 'hi-IN' or 'hi' voice.
 */
export const findBestVoice = (langCode = 'sat') => {
  const voices = getAvailableVoices();
  if (!voices || voices.length === 0) return null;

  if (langCode === 'sat') {
    // Note: Android Chrome / Google TTS exposes stub voice entries like 'Santali India' (sat-IN)
    // from system locales, but Google TTS has no actual voice data/engine for Santali.
    // Routing speech to that stub voice produces complete silence.
    // Therefore, skip any sat/santali stub and route to a functioning voice:

    // Priority 1: Indian English ('en-IN' or English voice with India in name/lang)
    const inEnVoice = voices.find((v) => {
      const l = (v.lang || '').toLowerCase();
      const n = (v.name || '').toLowerCase();
      const isEnglish = l.startsWith('en') || n.includes('english');
      const isIndian = l.includes('en-in') || l.includes('en_in') || n.includes('india');
      return isEnglish && isIndian;
    });
    if (inEnVoice) {
      return {
        voice: inEnVoice,
        isNative: false,
        label: `Indian English Engine (${inEnVoice.name})`,
        speechLang: inEnVoice.lang || 'en-IN',
        fallbackType: 'indian_english',
        preferredScript: 'roman'
      };
    }

    // Priority 2: Any English voice (en-US, en-GB, etc.)
    const enVoice = voices.find((v) => {
      const l = (v.lang || '').toLowerCase();
      const n = (v.name || '').toLowerCase();
      return l.startsWith('en') || n.includes('english');
    });
    if (enVoice) {
      return {
        voice: enVoice,
        isNative: false,
        label: `English Engine (${enVoice.name})`,
        speechLang: enVoice.lang || 'en-US',
        fallbackType: 'english',
        preferredScript: 'roman'
      };
    }

    // Priority 3: Hindi voice ('hi-IN' or 'hi') on Android devices with only Hindi voice pack
    const hiVoice = voices.find((v) => {
      const l = (v.lang || '').toLowerCase();
      const n = (v.name || '').toLowerCase();
      return l.startsWith('hi') || n.includes('hindi') || n.includes('हिन्दी');
    });
    if (hiVoice) {
      return {
        voice: hiVoice,
        isNative: false,
        label: `Hindi Engine (${hiVoice.name})`,
        speechLang: hiVoice.lang || 'hi-IN',
        fallbackType: 'hindi',
        preferredScript: 'devanagari'
      };
    }

    // Priority 4: System default voice (filter out any non-functional sat stub)
    const validVoices = voices.filter((v) => {
      const l = (v.lang || '').toLowerCase();
      const n = (v.name || '').toLowerCase();
      return !l.startsWith('sat') && !n.includes('santali') && !n.includes('santhali');
    });
    const defaultVoice = validVoices.find((v) => v.default) || validVoices[0] || voices[0];
    const defLang = (defaultVoice?.lang || '').toLowerCase();
    const isDefDevanagari = defLang.startsWith('hi') || defLang.startsWith('mr') || defLang.startsWith('ne');
    return {
      voice: defaultVoice,
      isNative: false,
      label: `System Default Engine (${defaultVoice?.name || 'Default'})`,
      speechLang: defaultVoice?.lang || (isDefDevanagari ? 'hi-IN' : 'en-US'),
      fallbackType: 'system_default',
      preferredScript: isDefDevanagari ? 'devanagari' : 'roman'
    };
  }

  if (langCode === 'hi') {
    const hiVoice = voices.find((v) => {
      const l = (v.lang || '').toLowerCase();
      const n = (v.name || '').toLowerCase();
      return l.startsWith('hi') || n.includes('hindi') || n.includes('हिन्दी');
    });
    if (hiVoice) {
      return {
        voice: hiVoice,
        isNative: true,
        label: `Hindi Voice (${hiVoice.name})`,
        speechLang: hiVoice.lang || 'hi-IN'
      };
    }
    return {
      voice: voices[0],
      isNative: false,
      label: `System Default Engine (${voices[0]?.name || 'Default'})`,
      speechLang: 'hi-IN'
    };
  }

  return {
    voice: voices[0] || null,
    isNative: false,
    label: voices[0]?.name || 'System Default',
    speechLang: 'en-US'
  };
};

/**
 * Speak text with audio callbacks and Android Chrome stability protections.
 *
 * CRITICAL MOBILE NOTE:
 * window.speechSynthesis.speak(utterance) is called SYNCHRONOUSLY within this function.
 * Do not delay with setTimeout, as doing so voids the user gesture token in mobile browsers.
 */
export const speakText = ({
  text,
  langCode = 'sat',
  romanPhonetic = '',
  devanagariPhonetic = '',
  onStart = () => {},
  onEnd = () => {},
  onError = () => {}
}) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    const err = new Error('Browser speech synthesis is not supported on this device.');
    err.error = 'not-supported';
    onError(err);
    return { success: false, error: err.message };
  }

  try {
    // 1. Android Chrome queue handling:
    // Only cancel if speech is actively speaking or queued.
    // Avoid double-cancel on idle engine which triggers synthesis-failed in Chrome Android.
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      window.speechSynthesis.cancel();
    }
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    const voiceMatch = findBestVoice(langCode);
    let textToSpeak = text;
    let actualSpeechLang = voiceMatch?.speechLang || (langCode === 'hi' ? 'hi-IN' : 'en-US');

    // 2. Santhali speech handling and script safety
    if (langCode === 'sat') {
      if (voiceMatch?.preferredScript === 'devanagari') {
        // Fallback voice is Hindi / Devanagari based: MUST speak Devanagari phonetics
        if (devanagariPhonetic && !containsOlChikiScript(devanagariPhonetic)) {
          textToSpeak = devanagariPhonetic;
        } else {
          const approx = generateOlChikiPronunciationApproximation(text);
          textToSpeak = approx?.devanagariApproximation || sanitizeRomanForTTS(romanPhonetic || text);
        }
        actualSpeechLang = voiceMatch?.voice?.lang || 'hi-IN';
      } else {
        // Fallback voice is English / Roman based: MUST speak sanitized ASCII Roman phonetics
        let candidate = romanPhonetic;
        if (!candidate && containsOlChikiScript(text)) {
          const approx = generateOlChikiPronunciationApproximation(text);
          candidate = approx?.romanApproximation || '';
        }
        if (!candidate) {
          candidate = text;
        }
        // Sanitize Roman characters: replace diacritics with plain ASCII so English TTS won't crash
        textToSpeak = sanitizeRomanForTTS(candidate);
        actualSpeechLang = voiceMatch?.voice?.lang || 'en-US';
      }

      // Strict guard: Never pass raw Ol Chiki characters to TTS
      if (containsOlChikiScript(textToSpeak)) {
        const err = new Error('Ol Chiki script cannot be pronounced directly by the browser voice. Please use the Roman or Devanagari pronunciation guide.');
        err.error = 'unsupported-script';
        onError(err);
        return { success: false, error: err.message };
      }
    }

    if (!textToSpeak || !textToSpeak.trim()) {
      const err = new Error('No readable text to pronounce.');
      err.error = 'invalid-argument';
      onError(err);
      return { success: false, error: err.message };
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak.trim());

    if (voiceMatch?.voice) {
      utterance.voice = voiceMatch.voice;
      utterance.lang = voiceMatch.voice.lang || actualSpeechLang;
    } else {
      utterance.lang = actualSpeechLang;
    }

    // Classroom tempo: slightly slower for clear listening
    utterance.rate = 0.85;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Retain utterance on window AND module scope to prevent V8 garbage collection mid-speech
    activeUtterance = utterance;
    if (typeof window !== 'undefined') {
      window._activeSpeechUtterance = utterance;
    }

    const cleanupUtterance = () => {
      activeUtterance = null;
      if (typeof window !== 'undefined') {
        window._activeSpeechUtterance = null;
      }
    };

    const startTime = Date.now();

    utterance.onstart = () => {
      onStart({
        voice: voiceMatch?.voice,
        label: voiceMatch?.label || 'Default Voice',
        lang: utterance.lang,
        spokenText: textToSpeak,
        script: voiceMatch?.preferredScript || 'roman',
        fallbackType: voiceMatch?.fallbackType || 'default',
        totalVoices: (getAvailableVoices() || []).length
      });
    };

    utterance.onend = () => {
      cleanupUtterance();
      onEnd({
        spokenText: textToSpeak,
        durationMs: Date.now() - startTime
      });
    };

    utterance.onerror = (e) => {
      cleanupUtterance();
      // Chrome/Safari emit 'interrupted' or 'canceled' when stopping intentionally
      if (e.error !== 'interrupted' && e.error !== 'canceled') {
        const errorDetail = e.error || 'synthesis-failed';
        const errorMsg = errorDetail === 'synthesis-failed'
          ? 'Device speech synthesis failed. Android TTS could not synthesize audio with the current voice.'
          : errorDetail === 'language-unavailable'
          ? 'The voice language is not downloaded in your Android TTS settings.'
          : errorDetail === 'voice-unavailable'
          ? 'The selected speech voice is unavailable.'
          : `Speech synthesis error: ${errorDetail}`;

        const err = new Error(errorMsg);
        err.error = errorDetail;
        onError(err);
      } else {
        onEnd();
      }
    };

    // Synchronous execution inside user gesture stack (Required by Android Chrome & iOS Safari)
    window.speechSynthesis.speak(utterance);

    // Wake up Android synthesis engine if paused right after queuing
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    return {
      success: true,
      voiceInfo: voiceMatch,
      spokenText: textToSpeak,
      isApproximation: langCode === 'sat' && !voiceMatch?.isNative
    };
  } catch (err) {
    activeUtterance = null;
    if (typeof window !== 'undefined') {
      window._activeSpeechUtterance = null;
    }
    onError(err);
    return { success: false, error: err.message };
  }
};

/**
 * Stop any active speech playback
 */
export const stopSpeech = () => {
  activeUtterance = null;
  if (typeof window !== 'undefined') {
    window._activeSpeechUtterance = null;
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (_) {
        // Ignore error
      }
    }
  }
};
