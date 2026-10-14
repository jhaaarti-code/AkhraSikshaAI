/**
 * Web Speech Recognition Service for AkhraSiksha AI
 * 
 * Uses the Web Speech API (SpeechRecognition / webkitSpeechRecognition).
 * Features:
 * - Explicit language locale (defaults to 'hi-IN' for Hindi teacher speech).
 * - Full handling of interim vs final recognition results.
 * - Extracts alternative candidates (maxAlternatives = 5) to help users spot recognition variants.
 * - Clear error handling with actionable browser recovery advice.
 * - Transparent accuracy disclaimer (no false claims of 100% speech accuracy).
 */

export const isSpeechRecognitionSupported = () => {
  if (typeof window === 'undefined') return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
};

/**
 * Checks whether the current browser natively supports a given language code
 * (such as 'sat' for Santhali) in Web Speech API.
 * Standard browsers (Chrome, Edge, Safari) support 'hi-IN' but do NOT currently
 * bundle a native 'sat' (Santhali) acoustic/language model in Web Speech API.
 */
export const checkSanthaliSpeechSupport = async () => {
  if (!isSpeechRecognitionSupported()) {
    return {
      apiSupported: false,
      satSupported: false,
      message: 'आपके ब्राउज़र में Web Speech API समर्थित नहीं है (Speech Recognition API is not supported in this browser). कृपया संथाली वाक्य मैन्युअल रूप से टाइप करें।'
    };
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  // Check W3C SpeechRecognition.available() if implemented by the browser
  if (typeof SpeechRecognition.available === 'function') {
    try {
      const availability = await SpeechRecognition.available({ langs: ['sat', 'sat-IN'] });
      if (availability === 'available' || availability === 'downloadable') {
        return {
          apiSupported: true,
          satSupported: true,
          message: 'Santhali (sat) speech recognition is available.'
        };
      }
      return {
        apiSupported: true,
        satSupported: false,
        message: '⚠️ वर्तमान ब्राउज़र संथाली स्पीच रिकग्निशन (भाषा कोड: "sat") का समर्थन नहीं करता है (Your current browser does not support Santhali speech recognition for language code "sat"). आप नीचे दिए गए संथाली टेक्स्ट बॉक्स में मैन्युअल रूप से टाइप या संपादित कर सकते हैं।'
      };
    } catch {
      // Fall through to standard check
    }
  }

  // Standard WebKit/Blink SpeechRecognition does not natively support ISO 639-2/3 'sat'
  return {
    apiSupported: true,
    satSupported: false,
    message: '⚠️ Browser Limitation: Android Chrome and standard browsers do not currently support Santhali speech recognition (language code "sat") because speech engines lack an acoustic model for Santhali. To prevent incorrect English or Hindi guesses from overwriting your text, microphone recognition is paused for Santhali. Please select from the verified classroom quick prompts below or type Romanized Santhali (e.g. "Johar machet") or Ol Chiki script manually.'
  };
};

/**
 * Explicitly requests microphone permission from the browser.
 * Releases the media stream immediately after permission is verified so SpeechRecognition can use it.
 */
export const requestMicrophonePermission = async () => {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    // Let SpeechRecognition.start() handle permission directly if getUserMedia is unavailable
    return { granted: true };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Stop tracks right away so SpeechRecognition can take over the microphone cleanly
    stream.getTracks().forEach((track) => track.stop());
    return { granted: true };
  } catch (err) {
    return {
      granted: false,
      error: 'माइक्रोफोन की अनुमति अस्वीकार कर दी गई है। कृपया ब्राउज़र में एड्रेस बार के पास लॉक (🔒) आइकन पर क्लिक करके माइक की अनुमति दें (Microphone permission was denied. Please allow microphone access in browser settings).'
    };
  }
};

export class ClassroomSpeechRecognizer {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.currentMode = null;
  }

  start({
    mode = 'teacher',
    lang = 'hi-IN',
    onStart = () => {},
    onResult = () => {},
    onError = () => {},
    onEnd = () => {}
  }) {
    if (!isSpeechRecognitionSupported()) {
      onError('आपके ब्राउज़र में स्पीच रिकग्निशन (माइक इनपुट) समर्थित नहीं है। कृपया Google Chrome या Microsoft Edge का उपयोग करें, या मैन्युअल रूप से टेक्स्ट टाइप करें (Speech Recognition is not supported in this browser).');
      return false;
    }

    // Stop any active recognition session before starting a new one
    this.stop();

    // Safety guard for Santhali:
    // Browser engines (Google Speech on Chrome/Android) do NOT bundle an acoustic model for 'sat'.
    // Starting with 'sat' causes browsers to fall back to English/Hindi and output distorted guesses.
    // Strictly block starting recognition for 'sat' to prevent distorted text from overwriting input.
    if (lang === 'sat' || lang.startsWith('sat-')) {
      const unsupportedMsg = '⚠️ Browser Limitation: Android Chrome and standard browsers do not currently support Santhali speech recognition (language code "sat") because speech engines lack an acoustic model for Santhali. Microphone recognition is paused to prevent incorrect English or Hindi words from overwriting your text. Please select from the verified classroom quick prompts below or type Romanized Santhali (e.g. "Johar machet") or Ol Chiki script manually.';
      onError(unsupportedMsg);
      return false;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.currentMode = mode;

      // Explicitly set the requested language code ('hi-IN' for Hindi, 'sat' for Santhali)
      const requestedLang = lang || 'hi-IN';
      this.recognition.lang = requestedLang;
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 5;

      let hasReceivedResult = false;

      this.recognition.onstart = () => {
        this.isListening = true;
        onStart();
      };

      this.recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        const alternatives = [];

        for (let i = 0; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res.isFinal) {
            finalTranscript += res[0].transcript;
          } else {
            interimTranscript += res[0].transcript;
          }

          // Capture top alternatives from the latest segment
          if (i === event.results.length - 1) {
            for (let j = 0; j < res.length; j++) {
              const alt = res[j];
              if (alt?.transcript) {
                alternatives.push({
                  transcript: alt.transcript.trim(),
                  confidence: alt.confidence || 0
                });
              }
            }
          }
        }

        const rawText = (finalTranscript || interimTranscript).trim();
        if (rawText) {
          hasReceivedResult = true;
        }

        onResult({
          finalTranscript: finalTranscript.trim(),
          interimTranscript: interimTranscript.trim(),
          rawText,
          isFinal: Boolean(finalTranscript),
          alternatives,
          langUsed: requestedLang
        });
      };

      this.recognition.onerror = (event) => {
        this.isListening = false;
        let userMessage = 'माइक्रोफोन त्रुटि हुई (Microphone error occurred).';

        switch (event.error) {
          case 'language-not-supported':
          case 'bad-grammar':
            if (requestedLang === 'sat' || requestedLang.startsWith('sat')) {
              userMessage = '⚠️ वर्तमान ब्राउज़र संथाली स्पीच रिकग्निशन (भाषा कोड: "sat") का समर्थन नहीं करता है (Your browser does not support Santhali speech recognition with language code "sat"). कृपया नीचे दिए गए संथाली इनपुट बॉक्स में मैन्युअल रूप से टाइप करें या त्वरित संथाली वाक्य चुनें।';
            } else {
              userMessage = `यह भाषा कोड (${requestedLang}) आपके ब्राउज़र के स्पीच रिकग्निशन में समर्थित नहीं है (Language "${requestedLang}" is not supported by your browser).`;
            }
            break;
          case 'not-allowed':
          case 'service-not-allowed':
            userMessage = 'माइक्रोफोन की अनुमति अस्वीकार कर दी गई है। कृपया ब्राउज़र में एड्रेस बार के पास लॉक (🔒) आइकन पर क्लिक करके माइक की अनुमति दें (Microphone permission was denied. Please allow microphone access in browser settings).';
            break;
          case 'no-speech':
            if (requestedLang === 'sat' || requestedLang.startsWith('sat')) {
              userMessage = '⚠️ संथाली ("sat") में कोई आवाज़ पहचानी नहीं जा सकी क्योंकि वर्तमान ब्राउज़र संथाली स्पीच रिकग्निशन ("sat") का मूल रूप से समर्थन नहीं करता है (Browser does not natively support Santhali "sat" speech recognition). कृपया नीचे दिए गए संथाली टेक्स्ट बॉक्स में मैन्युअल रूप से टाइप करें।';
            } else {
              userMessage = 'कोई आवाज़ सुनाई नहीं दी। कृपया माइक के पास साफ़ आवाज़ में बोलें (No speech detected. Please speak clearly near the microphone).';
            }
            break;
          case 'audio-capture':
            userMessage = 'कोई माइक्रोफोन डिवाइस नहीं मिला। कृपया जांचें कि माइक जुड़ा हुआ है (No microphone hardware found).';
            break;
          case 'network':
            userMessage = 'स्पीच रिकग्निशन के लिए इंटरनेट कनेक्शन आवश्यक है (Network error: Speech service requires active internet connection).';
            break;
          case 'aborted':
            // User manually stopped listening
            return;
          default:
            if (requestedLang === 'sat' || requestedLang.startsWith('sat')) {
              userMessage = `⚠️ संथाली स्पीच रिकग्निशन (कोड: "sat") इस ब्राउज़र में समर्थित नहीं है (${event.error}). कृपया संथाली वाक्य मैन्युअल रूप से टाइप करें।`;
            } else {
              userMessage = `स्पीच रिकग्निशन में समस्या आई: ${event.error}`;
            }
        }

        onError(userMessage);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        onEnd({ hasReceivedResult, langUsed: requestedLang });
      };

      this.recognition.start();
      return true;
    } catch (err) {
      this.isListening = false;
      onError(err.message || 'माइक्रोफोन शुरू करने में विफल (Failed to start speech recognition).');
      return false;
    }
  }

  stop() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        // Ignore if already stopped
      }
    }
    this.isListening = false;
  }
}

// Global singleton instance
export const speechRecognizer = new ClassroomSpeechRecognizer();
