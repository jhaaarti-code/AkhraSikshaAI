/**
 * Speech Synthesis Service for AkhraSiksha AI
 * Uses the Web Speech API (window.speechSynthesis).
 * Detects available browser voices honestly and provides fallback phonetic speech
 * if native Santhali voices are not installed by the host OS.
 */

export const getAvailableVoices = () => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return [];
  }
  return window.speechSynthesis.getVoices();
};

export const findBestVoice = (langCode = 'sat') => {
  const voices = getAvailableVoices();
  if (!voices || voices.length === 0) return null;

  if (langCode === 'sat') {
    // 1. Exact match for Santhali if available
    const satVoice = voices.find(v => 
      v.lang.toLowerCase().includes('sat') || 
      v.name.toLowerCase().includes('santhali') || 
      v.name.toLowerCase().includes('santali')
    );
    if (satVoice) return { voice: satVoice, isNative: true, label: 'Native Santhali Voice' };

    // 2. Hindi voice for phonetic Devanagari approximation
    const hiVoice = voices.find(v => v.lang.toLowerCase().includes('hi-in') || v.lang.toLowerCase().includes('hi'));
    if (hiVoice) return { voice: hiVoice, isNative: false, label: 'Hindi Engine (Phonetic Fallback)' };

    // 3. Indian English voice for Roman phonetic transliteration
    const inEnVoice = voices.find(v => v.lang.toLowerCase().includes('en-in'));
    if (inEnVoice) return { voice: inEnVoice, isNative: false, label: 'Indian English Engine (Phonetic Fallback)' };

    // 4. Default voice
    return { voice: voices[0], isNative: false, label: 'System Default Voice' };
  }

  if (langCode === 'hi') {
    const hiVoice = voices.find(v => v.lang.toLowerCase().includes('hi-in') || v.lang.toLowerCase().includes('hi'));
    if (hiVoice) return { voice: hiVoice, isNative: true, label: 'Native Hindi Voice' };
    return { voice: voices[0], isNative: false, label: 'System Default Voice' };
  }

  return { voice: voices[0] || null, isNative: false, label: 'System Default Voice' };
};

/**
 * Speak text with audio callbacks
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
    onError(new Error('Browser speech synthesis is not supported on this device.'));
    return false;
  }

  try {
    window.speechSynthesis.cancel(); // Stop any pending utterances

    const voiceMatch = findBestVoice(langCode);

    // If native Santhali is unavailable, speak using the phonetic Devanagari or Roman text
    // which browsers can enunciate much closer to actual pronunciation than raw Ol Chiki unicode
    let textToSpeak = text;
    if (langCode === 'sat' && (!voiceMatch || !voiceMatch.isNative)) {
      if (devanagariPhonetic && voiceMatch && voiceMatch.voice?.lang?.includes('hi')) {
        textToSpeak = devanagariPhonetic;
      } else if (romanPhonetic) {
        textToSpeak = romanPhonetic;
      }
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    if (voiceMatch?.voice) {
      utterance.voice = voiceMatch.voice;
      utterance.lang = voiceMatch.voice.lang;
    } else {
      utterance.lang = langCode === 'hi' ? 'hi-IN' : 'en-IN';
    }

    // Slightly slower rate for clear classroom pronunciation
    utterance.rate = 0.85;
    utterance.pitch = 1.0;

    utterance.onstart = onStart;
    utterance.onend = onEnd;
    utterance.onerror = (e) => {
      // Chrome/Safari sometimes emit 'interrupted' when cancelled; don't alert in that case
      if (e.error !== 'interrupted' && e.error !== 'canceled') {
        onError(e);
      } else {
        onEnd();
      }
    };

    window.speechSynthesis.speak(utterance);
    return { success: true, voiceInfo: voiceMatch };
  } catch (err) {
    onError(err);
    return false;
  }
};

export const stopSpeech = () => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};
