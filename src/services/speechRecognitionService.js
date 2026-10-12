/**
 * Web Speech Recognition Service for AkhraSiksha AI
 * Handles browser microphone speech-to-text (STT) using Web Speech API (SpeechRecognition / webkitSpeechRecognition).
 * Handles errors gracefully with clear user feedback without inventing fake text.
 */

export const isSpeechRecognitionSupported = () => {
  if (typeof window === 'undefined') return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
};

export class ClassroomSpeechRecognizer {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.currentMode = null; // 'teacher' (hi-IN) or 'student' (sat / hi-IN fallback)
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
      onError('आपके ब्राउज़र में स्पीच रिकग्निशन (माइक इनपुट) समर्थित नहीं है। कृपया Google Chrome या Edge का उपयोग करें (Speech Recognition is not supported in this browser. Please use Chrome or Edge).');
      return false;
    }

    // Stop any existing recognition
    this.stop();

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.currentMode = mode;

      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;
      this.recognition.lang = lang;

      this.recognition.onstart = () => {
        this.isListening = true;
        onStart();
      };

      this.recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        onResult({
          finalTranscript: finalTranscript.trim(),
          interimTranscript: interimTranscript.trim(),
          rawText: (finalTranscript || interimTranscript).trim()
        });
      };

      this.recognition.onerror = (event) => {
        this.isListening = false;
        let userMessage = 'माइक्रोफोन त्रुटि हुई (Microphone error occurred).';

        switch (event.error) {
          case 'not-allowed':
          case 'service-not-allowed':
            userMessage = 'माइक्रोफोन की अनुमति अस्वीकार कर दी गई है। कृपया ब्राउज़र में माइक की अनुमति दें (Microphone permission was denied. Please allow microphone access in browser settings).';
            break;
          case 'no-speech':
            userMessage = 'कोई आवाज़ सुनाई नहीं दी। कृपया माइक के पास साफ़ आवाज़ में बोलें (No speech detected. Please speak clearly near the microphone).';
            break;
          case 'audio-capture':
            userMessage = 'कोई माइक्रोफोन डिवाइस नहीं मिला (No microphone hardware found).';
            break;
          case 'network':
            userMessage = 'स्पीच रिकग्निशन के लिए इंटरनेट कनेक्शन आवश्यक है (Network error occurred during speech recognition).';
            break;
          default:
            userMessage = `स्पीच रिकग्निशन में समस्या आई: ${event.error}`;
        }

        onError(userMessage);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        onEnd();
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
