import React, { useState, useEffect } from 'react';
import { SUPPORTED_LANGUAGES } from '../data/languages';
import { 
  SAMPLE_PROMPTS, 
  STUDENT_SAMPLE_PROMPTS 
} from '../data/curatedPhrases';
import { 
  translateHindiToTribal, 
  translateSanthaliToHindi 
} from '../services/translatorService';
import { 
  speakText, 
  stopSpeech, 
  findBestVoice, 
  onVoicesLoaded, 
  checkSanthaliVoiceSupport,
  getAvailableVoices
} from '../services/speechService';
import { generateOlChikiPronunciationApproximation } from '../utils/olChikiTransliterator';
import { 
  speechRecognizer, 
  isSpeechRecognitionSupported,
  checkSanthaliSpeechSupport,
  requestMicrophonePermission
} from '../services/speechRecognitionService';

export default function TranslatorSection({ onOpenApiGuide }) {
  // Mode: 'teacher' (Hindi -> Santhali), 'student' (Santhali -> Hindi), or 'dual' (Both together)
  const [activeMode, setActiveMode] = useState('teacher');

  // Teacher State (Hindi -> Santhali)
  const [teacherHindiText, setTeacherHindiText] = useState('नमस्ते बच्चों, कक्षा में आपका स्वागत है');
  const [teacherTranslation, setTeacherTranslation] = useState(null);
  const [isTeacherLoading, setIsTeacherLoading] = useState(false);
  const [isTeacherListening, setIsTeacherListening] = useState(false);
  const [teacherError, setTeacherError] = useState('');
  const [isTeacherHindiSpeaking, setIsTeacherHindiSpeaking] = useState(false);
  const [isTeacherSanthaliSpeaking, setIsTeacherSanthaliSpeaking] = useState(false);

  // Student State (Santhali -> Hindi)
  const [studentSanthaliText, setStudentSanthaliText] = useState('Johar machet');
  const [studentTranslation, setStudentTranslation] = useState(null);
  const [isStudentLoading, setIsStudentLoading] = useState(false);
  const [isStudentListening, setIsStudentListening] = useState(false);
  const [studentError, setStudentError] = useState('');
  const [santhaliSpeechStatus, setSanthaliSpeechStatus] = useState('');
  const [isStudentSpeaking, setIsStudentSpeaking] = useState(false);

  // Target Tribal Language Selection
  const [selectedLanguage, setSelectedLanguage] = useState('sat');
  const [copiedKey, setCopiedKey] = useState('');
  const [speechNotice, setSpeechNotice] = useState('');

  // Santhali Voice Support State (monitored asynchronously for Android Chrome)
  const [santhaliVoiceStatus, setSanthaliVoiceStatus] = useState({
    isNativeSupported: false,
    voiceLabel: '',
    checked: false
  });

  // Diagnostic state to trace fallback playback lifecycle on Android Chrome
  const [audioDiagnostics, setAudioDiagnostics] = useState(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  // Initial translation & voice detection on component mount
  useEffect(() => {
    handleTranslateTeacher(teacherHindiText);
    handleTranslateStudent(studentSanthaliText);

    // Detect voices immediately and listen for asynchronous loading (vital on Android Chrome)
    const updateVoiceDetection = () => {
      const support = checkSanthaliVoiceSupport();
      const best = findBestVoice('sat');
      setSanthaliVoiceStatus({
        isNativeSupported: support.isNativeSupported,
        voiceLabel: best?.label || '',
        checked: true
      });
    };

    updateVoiceDetection();
    const unsubscribeVoices = onVoicesLoaded(() => {
      updateVoiceDetection();
    });

    return () => {
      speechRecognizer.stop();
      stopSpeech();
      unsubscribeVoices();
    };
  }, []);

  // -------------------------------------------------------------------------
  // Teacher Actions: Hindi -> Santhali
  // -------------------------------------------------------------------------
  const handleTranslateTeacher = async (text = teacherHindiText) => {
    const trimmed = (text || '').trim();
    setTeacherError('');
    setSpeechNotice('');

    if (!trimmed) {
      setTeacherError('⚠️ कृपया शिक्षक का हिंदी वाक्य दर्ज करें या माइक पर बोलें (Please enter or speak a Hindi sentence).');
      setTeacherTranslation(null);
      return;
    }

    setIsTeacherLoading(true);
    stopSpeech();
    setIsTeacherHindiSpeaking(false);
    setIsTeacherSanthaliSpeaking(false);

    try {
      const res = await translateHindiToTribal({
        text: trimmed,
        targetLanguageCode: selectedLanguage
      });
      setTeacherTranslation(res);
    } catch (err) {
      setTeacherError(err.message || 'अनुवाद विफल रहा (Translation failed).');
      setTeacherTranslation(null);
    } finally {
      setIsTeacherLoading(false);
    }
  };

  const startTeacherListening = () => {
    setTeacherError('');
    stopSpeech();
    setIsTeacherHindiSpeaking(false);
    setIsTeacherSanthaliSpeaking(false);

    if (!isSpeechRecognitionSupported()) {
      setTeacherError('⚠️ आपके ब्राउज़र में माइक्रोफ़ोन स्पीच रिकग्निशन समर्थित नहीं है। कृपया Google Chrome का उपयोग करें या नीचे दिए गए त्वरित वाक्य चुनें।');
      return;
    }

    const started = speechRecognizer.start({
      mode: 'teacher',
      lang: 'hi-IN',
      onStart: () => {
        setIsTeacherListening(true);
        setSpeechNotice('🎙️ Hindi speech recognition active (hi-IN). Speak clearly near the microphone.');
      },
      onResult: ({ rawText, finalTranscript, isFinal }) => {
        // Show live interim text in the textarea so the user sees what's being heard
        const textToUse = finalTranscript || rawText;
        if (textToUse) {
          setTeacherHindiText(textToUse);
        }
        // Do NOT auto-translate — let the user review and click "Translate" manually
      },
      onError: (errMsg) => {
        setIsTeacherListening(false);
        setTeacherError(errMsg);
      },
      onEnd: () => {
        setIsTeacherListening(false);
        setSpeechNotice('');
      }
    });

    if (!started) {
      setIsTeacherListening(false);
    }
  };

  const stopTeacherListening = () => {
    speechRecognizer.stop();
    setIsTeacherListening(false);
  };

  // Play Teacher's Hindi Input Text Aloud (Feature 2)
  const handleSpeakTeacherHindi = () => {
    try {
      if (isTeacherHindiSpeaking) {
        stopSpeech();
        setIsTeacherHindiSpeaking(false);
        setSpeechNotice('');
        return;
      }

      // If Santhali audio is currently playing, stop it first
      if (isTeacherSanthaliSpeaking) {
        stopSpeech();
        setIsTeacherSanthaliSpeaking(false);
      }

      const trimmed = (teacherHindiText || '').trim();
      if (!trimmed) {
        setTeacherError('⚠️ कोई हिंदी वाक्य नहीं है जो बोला जा सके। पहले वाक्य टाइप करें या माइक से बोलें (No Hindi text to speak. Type or speak a sentence first).');
        return;
      }

      setSpeechNotice(''); // Clear any previous error

      const res = speakText({
        text: trimmed,
        langCode: 'hi',
        onStart: (voiceInfo) => {
          setIsTeacherHindiSpeaking(true);
          setIsTeacherSanthaliSpeaking(false);
          const voiceLabel = voiceInfo?.label || 'Hindi Voice';
          setSpeechNotice(`🔊 Playing Hindi audio using ${voiceLabel}.`);
        },
        onEnd: () => {
          setIsTeacherHindiSpeaking(false);
          setSpeechNotice('');
        },
        onError: (err) => {
          setIsTeacherHindiSpeaking(false);
          setSpeechNotice(`⚠️ Hindi audio playback failed: ${err?.message || 'TTS engine unavailable in this browser.'}`);
        }
      });

      if (res?.error) {
        setSpeechNotice(`⚠️ Hindi audio error: ${res.error}`);
      }
    } catch (err) {
      console.error('handleSpeakTeacherHindi error:', err);
      setIsTeacherHindiSpeaking(false);
      setSpeechNotice(`⚠️ Hindi audio handler error: ${err?.message || 'Unexpected error'}`);
    }
  };

  const handleSpeakSanthali = () => {
    try {
      if (isTeacherSanthaliSpeaking) {
        stopSpeech();
        setIsTeacherSanthaliSpeaking(false);
        setSpeechNotice('');
        setAudioDiagnostics((prev) => prev ? { ...prev, status: 'Playback stopped by user' } : null);
        return;
      }

      // If Hindi audio is currently playing, stop it first
      if (isTeacherHindiSpeaking) {
        stopSpeech();
        setIsTeacherHindiSpeaking(false);
      }

      if (!teacherTranslation) {
        setSpeechNotice('⚠️ कोई अनुवाद उपलब्ध नहीं है। पहले एक वाक्य का अनुवाद करें (No translation available to speak).');
        return;
      }

      // Determine the Roman pronunciation guide (browser TTS engines cannot read Ol Chiki script)
      let romanGuide = teacherTranslation.santhaliRoman || '';
      if (!romanGuide && teacherTranslation.santhaliOlChiki) {
        // Auto-generate Roman approximation if not already in translation object
        const approx = generateOlChikiPronunciationApproximation(teacherTranslation.santhaliOlChiki);
        romanGuide = approx?.romanApproximation || '';
      }

      if (!romanGuide && !teacherTranslation.santhaliDevanagari) {
        setSpeechNotice('⚠️ इस वाक्य का रोमन उच्चारण गाइड उपलब्ध नहीं है (No Roman pronunciation guide available).');
        return;
      }

      setSpeechNotice(''); // Clear any previous error

      const textCandidate = romanGuide || teacherTranslation.santhaliDevanagari;
      const initialVoices = getAvailableVoices();
      setAudioDiagnostics({
        status: 'Queued to speak (waiting for onstart)...',
        time: new Date().toLocaleTimeString(),
        text: textCandidate,
        totalVoices: initialVoices.length
      });

      const res = speakText({
        text: textCandidate,
        langCode: selectedLanguage, // 'sat'
        romanPhonetic: romanGuide,
        devanagariPhonetic: teacherTranslation.santhaliDevanagari || '',
        onStart: (voiceInfo) => {
          setIsTeacherSanthaliSpeaking(true);
          setIsTeacherHindiSpeaking(false);
          const voiceLabel = voiceInfo?.label || 'available browser voice';
          setSpeechNotice(`📢 Playing approximate pronunciation guide using ${voiceLabel} (Not authentic Santhali voice).`);
          setAudioDiagnostics({
            status: 'onstart fired (synthesis started)',
            time: new Date().toLocaleTimeString(),
            voiceLabel: voiceInfo?.label,
            voiceLang: voiceInfo?.lang,
            script: voiceInfo?.script,
            fallbackType: voiceInfo?.fallbackType,
            text: voiceInfo?.spokenText,
            totalVoices: voiceInfo?.totalVoices
          });
        },
        onEnd: (info) => {
          setIsTeacherSanthaliSpeaking(false);
          setSpeechNotice('');
          setAudioDiagnostics((prev) => prev ? {
            ...prev,
            status: `onend fired (finished in ${info?.durationMs ?? 0}ms)`,
            time: new Date().toLocaleTimeString()
          } : null);
        },
        onError: (err) => {
          setIsTeacherSanthaliSpeaking(false);
          setSpeechNotice(`⚠️ Santhali audio playback notice: ${err?.message || err?.error || 'Speech synthesis failed on this device.'}`);
          setAudioDiagnostics((prev) => prev ? {
            ...prev,
            status: `onerror fired: ${err?.message || err?.error || 'Speech synthesis error'}`,
            time: new Date().toLocaleTimeString()
          } : null);
        }
      });

      if (res?.error) {
        setSpeechNotice(`⚠️ Santhali audio error: ${res.error}`);
        setAudioDiagnostics((prev) => ({
          ...(prev || {}),
          status: `speakText error: ${res.error}`,
          time: new Date().toLocaleTimeString()
        }));
      }
    } catch (err) {
      console.error('handleSpeakSanthali error:', err);
      setIsTeacherSanthaliSpeaking(false);
      setSpeechNotice(`⚠️ Santhali audio handler error: ${err?.message || 'Unexpected error'}`);
      setAudioDiagnostics((prev) => ({
        ...(prev || {}),
        status: `Handler exception: ${err?.message || 'Error'}`,
        time: new Date().toLocaleTimeString()
      }));
    }
  };

  // -------------------------------------------------------------------------
  // Student Actions: Santhali -> Hindi
  // -------------------------------------------------------------------------
  const handleTranslateStudent = async (text = studentSanthaliText) => {
    const trimmed = (text || '').trim();
    setStudentError('');
    setSpeechNotice('');

    if (!trimmed) {
      setStudentError('⚠️ कृपया संथाली वाक्य दर्ज करें या माइक पर बोलें (Please enter or speak a Santhali sentence).');
      setStudentTranslation(null);
      return;
    }

    setIsStudentLoading(true);
    stopSpeech();
    setIsStudentSpeaking(false);

    try {
      const res = await translateSanthaliToHindi({
        text: trimmed
      });
      setStudentTranslation(res);
    } catch (err) {
      setStudentError(err.message || 'अनुवाद विफल रहा (Translation failed).');
      setStudentTranslation(null);
    } finally {
      setIsStudentLoading(false);
    }
  };

  const startStudentListening = async () => {
    setStudentError('');
    setSanthaliSpeechStatus('');
    stopSpeech();
    setIsStudentSpeaking(false);

    if (!isSpeechRecognitionSupported()) {
      setStudentError('⚠️ आपके ब्राउज़र में माइक्रोफ़ोन स्पीच रिकग्निशन समर्थित नहीं है (Speech recognition is not supported in this browser). कृपया नीचे दिए गए बॉक्स में संथाली वाक्य टाइप करें।');
      return;
    }

    // 1. Check whether the current browser natively supports Santhali ('sat') speech recognition
    const supportCheck = await checkSanthaliSpeechSupport();
    if (!supportCheck.satSupported) {
      // Clearly inform the user and do NOT let the browser's English model capture distorted text
      setSanthaliSpeechStatus(supportCheck.message);
      setIsStudentListening(false);
      return;
    }

    // 2. Explicitly request microphone permission (only reached if native sat recognition is supported)
    const permResult = await requestMicrophonePermission();
    if (!permResult.granted) {
      setStudentError(permResult.error);
      return;
    }

    // 3. Attempt speech recognition using the Santhali language code 'sat'
    const started = speechRecognizer.start({
      mode: 'student',
      lang: 'sat',
      onStart: () => {
        setIsStudentListening(true);
        setSpeechNotice('🎤 Santhali speech recognition active (code: "sat")...');
      },
      onResult: ({ rawText, finalTranscript, isFinal }) => {
        const textToUse = finalTranscript || rawText;
        if (textToUse) {
          setStudentSanthaliText(textToUse);
          if (isFinal) {
            handleTranslateStudent(textToUse);
          }
        }
      },
      onError: (errMsg) => {
        setIsStudentListening(false);
        setSpeechNotice('');
        setStudentError(errMsg);
      },
      onEnd: () => {
        setIsStudentListening(false);
        setSpeechNotice('');
      }
    });

    if (!started) {
      setIsStudentListening(false);
    }
  };

  const stopStudentListening = () => {
    speechRecognizer.stop();
    setIsStudentListening(false);
    setSpeechNotice('');
  };

  const handleSpeakHindi = () => {
    if (isStudentSpeaking) {
      stopSpeech();
      setIsStudentSpeaking(false);
      setSpeechNotice('');
      return;
    }

    if (!studentTranslation?.hindiTranslation) {
      setStudentError('⚠️ कोई हिंदी अनुवाद उपलब्ध नहीं है जिसे बोला जा सके (No Hindi translation available to speak).');
      return;
    }

    setSpeechNotice('');

    const res = speakText({
      text: studentTranslation.hindiTranslation,
      langCode: 'hi',
      onStart: (voiceInfo) => {
        setIsStudentSpeaking(true);
        const voiceLabel = voiceInfo?.label || 'Hindi Voice';
        setSpeechNotice(`🔊 Playing translated Hindi audio using ${voiceLabel}.`);
      },
      onEnd: () => {
        setIsStudentSpeaking(false);
        setSpeechNotice('');
      },
      onError: (err) => {
        setIsStudentSpeaking(false);
        setSpeechNotice(`⚠️ Hindi speech engine error: ${err?.message || 'Hindi TTS unavailable.'}`);
      }
    });

    if (res?.error) {
      setSpeechNotice(`⚠️ Hindi speech error: ${res.error}`);
    }
  };

  const handleCopy = (content, key) => {
    if (!content) return;
    navigator.clipboard.writeText(content).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(''), 2000);
    });
  };

  const currentLangObj = SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage) || SUPPORTED_LANGUAGES[0];

  return (
    <div className="bidirectional-translator-wrapper">
      {/* Mode Navigation Tabs */}
      <div className="mode-switcher-bar">
        <div className="mode-tabs-group" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeMode === 'teacher'}
            className={`mode-tab-btn ${activeMode === 'teacher' ? 'mode-tab-active teacher-tab' : ''}`}
            onClick={() => setActiveMode('teacher')}
          >
            <span className="mode-tab-icon">👩‍🏫</span>
            <div className="mode-tab-labels">
              <span className="mode-tab-primary">Teacher Mode</span>
              <span className="mode-tab-secondary">Hindi Speech ➔ Santhali</span>
            </div>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeMode === 'student'}
            className={`mode-tab-btn ${activeMode === 'student' ? 'mode-tab-active student-tab' : ''}`}
            onClick={() => setActiveMode('student')}
          >
            <span className="mode-tab-icon">🧒</span>
            <div className="mode-tab-labels">
              <span className="mode-tab-primary">Student Mode</span>
              <span className="mode-tab-secondary">Santhali Speech ➔ Hindi</span>
            </div>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeMode === 'dual'}
            className={`mode-tab-btn ${activeMode === 'dual' ? 'mode-tab-active dual-tab' : ''}`}
            onClick={() => setActiveMode('dual')}
          >
            <span className="mode-tab-icon">🔄</span>
            <div className="mode-tab-labels">
              <span className="mode-tab-primary">Dual Classroom View</span>
              <span className="mode-tab-secondary">Both Modes Side-by-Side</span>
            </div>
          </button>
        </div>

        {/* Target Language Dropdown */}
        <div className="target-lang-mini-selector">
          <label htmlFor="target-lang-dropdown" className="mini-select-label">Target Tribal Language:</label>
          <select
            id="target-lang-dropdown"
            className="mini-select"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name} {lang.status === 'roadmap' ? '(Roadmap)' : '— Ol Chiki'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Translation Cards Grid */}
      <div className={`bidirectional-grid ${activeMode === 'dual' ? 'dual-layout' : 'single-layout'}`}>
        
        {/* ================================================================= */}
        {/* PANEL 1: TEACHER'S HINDI SPEECH ➔ SANTHALI TRANSLATION            */}
        {/* ================================================================= */}
        {(activeMode === 'teacher' || activeMode === 'dual') && (
          <section className="speech-direction-card teacher-card" aria-label="Teacher Hindi to Santhali Translator">
            <div className="card-top-banner teacher-banner">
              <div className="banner-title-wrap">
                <span className="banner-badge">👩‍🏫 Teacher Mode (शिक्षक संवाद)</span>
                <h3>Hindi Speech ➔ Santhali Translation</h3>
              </div>
              <span className="direction-flow-pill">Hindi ➔ Ol Chiki</span>
            </div>

            {/* 1. RECOGNIZED HINDI SPEECH BOX (EDITABLE) */}
            <div className="box-section input-speech-box">
              <div className="box-header-row">
                <label htmlFor="teacher-speech-input" className="box-label">
                  <span className="step-circle">1</span>
                  <span>Teacher's Recognized Hindi Speech (पहचाना गया हिंदी वाक्य):</span>
                </label>

                {/* Microphone Toggle Button */}
                <div className="mic-actions-group">
                  {isTeacherListening ? (
                    <button
                      type="button"
                      className="btn-mic-active pulse-mic"
                      onClick={stopTeacherListening}
                      title="Stop microphone recording"
                    >
                      <span className="mic-symbol">⏹</span>
                      <span>Stop Listening</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn-mic-start"
                      onClick={startTeacherListening}
                      title="Click to speak in Hindi using microphone"
                    >
                      <span className="mic-symbol">🎙️</span>
                      <span>Speak Hindi (बोलें)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Active Listening Indicator */}
              {isTeacherListening && (
                <div className="live-listening-banner animate-fade-in" role="status">
                  <span className="pulsing-record-dot"></span>
                  <strong>Listening now... कृपया हिंदी में कक्षा का वाक्य बोलें</strong>
                  <div className="mini-sound-waves">
                    <span className="wave-bar w-1"></span>
                    <span className="wave-bar w-2"></span>
                    <span className="wave-bar w-3"></span>
                  </div>
                </div>
              )}

              {/* Editable Textarea for Recognized Speech */}
              <div className="textarea-wrapper">
                <textarea
                  id="teacher-speech-input"
                  className="speech-textarea"
                  rows={3}
                  value={teacherHindiText}
                  onChange={(e) => {
                    setTeacherHindiText(e.target.value);
                    if (teacherError) setTeacherError('');
                  }}
                  placeholder="यहाँ शिक्षक का हिंदी वाक्य दिखाई देगा, आप इसे टाइप या संपादित भी कर सकते हैं..."
                />
                <div className="textarea-meta-bar">
                  <span className="hint-text">✏️ You can edit the recognized Hindi text above anytime.</span>
                  <div className="textarea-actions-group">
                    <button
                      type="button"
                      className={`btn-audio-small hindi-audio-btn ${isTeacherHindiSpeaking ? 'audio-active' : ''}`}
                      onClick={handleSpeakTeacherHindi}
                      title="Play Hindi text aloud"
                    >
                      <span className="audio-icon">{isTeacherHindiSpeaking ? '⏹' : '🔊'}</span>
                      <span>{isTeacherHindiSpeaking ? 'Stop' : 'Play Hindi Audio'}</span>
                    </button>
                    <button
                      type="button"
                      className="btn-action-small"
                      onClick={() => handleTranslateTeacher(teacherHindiText)}
                      disabled={isTeacherLoading}
                    >
                      {isTeacherLoading ? 'Translating...' : 'Translate / अनुवाद करें ➔'}
                    </button>
                  </div>
                </div>

                {/* Hindi Speech Feedback Banner (Mobile-Friendly) */}
                {speechNotice && (isTeacherHindiSpeaking || speechNotice.includes('Hindi')) && (
                  <div className="speech-inline-feedback animate-fade-in" role="status" style={{ marginTop: '0.6rem' }}>
                    <span>{speechNotice}</span>
                    <button type="button" className="btn-alert-dismiss" onClick={() => setSpeechNotice('')}>✕</button>
                  </div>
                )}
              </div>

              {/* One-Click Sample Prompts */}
              <div className="quick-prompts-row">
                <span className="prompts-title">⚡ Quick Prompts (त्वरित वाक्य):</span>
                <div className="prompts-chips-wrap">
                  {SAMPLE_PROMPTS.slice(0, 4).map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      className="btn-prompt-chip"
                      onClick={() => {
                        setTeacherHindiText(p.text);
                        handleTranslateTeacher(p.text);
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error Notice */}
              {teacherError && (
                <div className="alert-message error-alert animate-shake" role="alert">
                  <span className="alert-icon">⚠️</span>
                  <div className="alert-body">
                    <p>{teacherError}</p>
                  </div>
                  <button type="button" className="btn-alert-dismiss" onClick={() => setTeacherError('')}>✕</button>
                </div>
              )}
            </div>

            {/* 2. TRANSLATED SANTHALI TEXT BOX (SEPARATE BOX BELOW) */}
            <div className="box-section translation-result-box">
              <div className="box-header-row">
                <div className="box-label">
                  <span className="step-circle step-green">2</span>
                  <span>Santhali Classroom Translation (संथाली अनुवाद):</span>
                </div>

                {teacherTranslation && (teacherTranslation.isVerified || (teacherTranslation.isMachineTranslated && (teacherTranslation.santhaliRoman || teacherTranslation.santhaliDevanagari || teacherTranslation.santhaliOlChiki))) && (
                  <button
                    type="button"
                    className={`btn-audio-playback santhali-audio-btn ${isTeacherSanthaliSpeaking ? 'audio-active' : ''}`}
                    onClick={handleSpeakSanthali}
                    aria-label={santhaliVoiceStatus.isNativeSupported ? 'Play Native Santhali Audio' : 'Play Roman Pronunciation Guide (Approximation)'}
                    title={santhaliVoiceStatus.isNativeSupported ? 'Play native Santhali voice audio' : 'Play approximate pronunciation of Roman guide using fallback browser voice'}
                  >
                    <span className="audio-icon">{isTeacherSanthaliSpeaking ? '⏹' : '🔊'}</span>
                    <span>
                      {isTeacherSanthaliSpeaking
                        ? 'Stop Audio'
                        : santhaliVoiceStatus.isNativeSupported
                        ? 'Play Santhali Audio'
                        : 'Play Roman Guide (Approx Audio)'}
                    </span>
                  </button>
                )}
              </div>

              {/* Santhali Audio Notice (Single Unified Clean Banner) */}
              {teacherTranslation && (teacherTranslation.isVerified || teacherTranslation.isMachineTranslated) && !santhaliVoiceStatus.isNativeSupported && (
                <div className="santhali-tts-limitation-banner animate-fade-in" role="note">
                  <span className="limitation-icon">ℹ️</span>
                  <div className="limitation-text">
                    <strong>Audio Notice:</strong> Native Santhali (<code>sat</code>) speech synthesis is unavailable on Android and desktop browsers. 
                    The button above plays an <em>approximate pronunciation</em> of the Roman guide using an available browser voice ({santhaliVoiceStatus.voiceLabel || 'Indian English'}), NOT authentic Santhali speech.
                    {isTeacherSanthaliSpeaking && (
                      <span className="playing-indicator-text">
                        🔊 <em>Now playing approximate pronunciation...</em>
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Temporary Audio Diagnostics Panel for Mobile Testing */}
              {teacherTranslation && (
                <div className="audio-diagnostics-box" style={{ marginTop: '0.5rem', marginBottom: '0.6rem', fontSize: '0.8rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0.45rem 0.7rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setShowDiagnostics(!showDiagnostics)}>
                    <span style={{ fontWeight: 600, color: '#334155' }}>
                      🔍 Audio Diagnostics: <span style={{ color: audioDiagnostics?.status?.includes('error') ? '#dc2626' : audioDiagnostics?.status?.includes('onstart') ? '#16a34a' : '#2563eb' }}>{audioDiagnostics?.status || 'Ready (tap audio button to trace)'}</span>
                    </span>
                    <button type="button" style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.75rem', cursor: 'pointer' }}>
                      {showDiagnostics ? '▲ Hide' : '▼ Details'}
                    </button>
                  </div>
                  {showDiagnostics && (
                    <div style={{ marginTop: '0.4rem', paddingTop: '0.4rem', borderTop: '1px dashed #cbd5e1', fontFamily: 'monospace', fontSize: '0.75rem', color: '#334155', lineHeight: 1.5 }}>
                      <div><strong>Status:</strong> {audioDiagnostics?.status || 'Idle'}</div>
                      <div><strong>Selected Voice:</strong> {audioDiagnostics?.voiceLabel || santhaliVoiceStatus.voiceLabel || 'None'}</div>
                      <div><strong>Voice Language:</strong> {audioDiagnostics?.voiceLang || 'N/A'}</div>
                      <div><strong>Script Mode:</strong> {audioDiagnostics?.script || 'roman'}</div>
                      <div><strong>Fallback Type:</strong> {audioDiagnostics?.fallbackType || 'N/A'}</div>
                      <div><strong>Total Detected Voices:</strong> {audioDiagnostics?.totalVoices ?? getAvailableVoices().length}</div>
                      <div><strong>Spoken Text:</strong> "{audioDiagnostics?.text || 'N/A'}"</div>
                      <div><strong>Timestamp:</strong> {audioDiagnostics?.time || 'N/A'}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Inline Speech Notice (Only for Errors) */}
              {speechNotice && speechNotice.startsWith('⚠️') && (
                <div className="speech-inline-feedback animate-fade-in" role="alert">
                  <span>{speechNotice}</span>
                  <button type="button" className="btn-alert-dismiss" onClick={() => setSpeechNotice('')}>✕</button>
                </div>
              )}

              {isTeacherLoading ? (
                <div className="loading-card">
                  <div className="spinner-circle"></div>
                  <span>Translating Hindi to Santhali Ol Chiki...</span>
                </div>
              ) : teacherTranslation ? (
                teacherTranslation.isVerified ? (
                  <div className="translation-display-card animate-fade-in">
                    {/* Verified Badge */}
                    <div className="result-badge-row">
                      <span className="badge-pill badge-verified">
                        ✓ Verified Primer Match
                      </span>
                      <span className="badge-script">Ol Chiki Script</span>
                    </div>

                    {/* Primary Ol Chiki Text Display */}
                    <div className="ol-chiki-screen">
                      {teacherTranslation.santhaliOlChiki}
                    </div>

                    {/* Phonetic Pronunciation Guide */}
                    <div className="phonetics-dual-row">
                      <div className="phonetic-col">
                        <span className="phonetic-tag">Roman / English Pronunciation:</span>
                        <p className="phonetic-val">{teacherTranslation.santhaliRoman}</p>
                      </div>
                      <div className="phonetic-col">
                        <span className="phonetic-tag">देवनागरी उच्चारण (Hindi phonetic):</span>
                        <p className="phonetic-val">{teacherTranslation.santhaliDevanagari}</p>
                      </div>
                    </div>

                    {/* English Meaning & Teacher Context */}
                    <div className="meaning-strip">
                      <strong>English Meaning:</strong> <span>{teacherTranslation.english}</span>
                    </div>

                    <div className="pedagogy-tip-strip">
                      <span className="tip-star">💡</span>
                      <span>{teacherTranslation.teacherTip}</span>
                    </div>
                  </div>
                ) : teacherTranslation.isMachineTranslated ? (
                  <div className="translation-display-card animate-fade-in" style={{ borderColor: '#F59E0B', background: '#FFFDF7' }}>
                    {/* Unverified Machine Translation Badges */}
                    <div className="result-badge-row" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                      <span
                        className="badge-pill"
                        style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #F59E0B', fontWeight: 700 }}
                      >
                        ⚠️ Unverified Machine Translation (Prototype)
                      </span>
                      <span className="badge-script" title={teacherTranslation.scriptCheckNote}>
                        Ol Chiki Script Detected (Script check ≠ accuracy guarantee)
                      </span>
                    </div>

                    {/* Primary Ol Chiki Text Display */}
                    <div className="ol-chiki-screen">
                      {teacherTranslation.santhaliOlChiki}
                    </div>

                    {/* Approximate Phonetic Pronunciation Guides (Only when reliable conversion is present) */}
                    {(teacherTranslation.santhaliRoman || teacherTranslation.santhaliDevanagari) && (
                      <div className="phonetics-dual-row">
                        {teacherTranslation.santhaliRoman && (
                          <div className="phonetic-col">
                            <span className="phonetic-tag">Roman Pronunciation (Auto-Generated Approximation — Unverified):</span>
                            <p className="phonetic-val">{teacherTranslation.santhaliRoman}</p>
                          </div>
                        )}
                        {teacherTranslation.santhaliDevanagari && (
                          <div className="phonetic-col">
                            <span className="phonetic-tag">देवनागरी उच्चारण (Auto-Generated Approximation — Unverified):</span>
                            <p className="phonetic-val">{teacherTranslation.santhaliDevanagari}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* English Meaning Approximation */}
                    {teacherTranslation.english && (
                      <div className="meaning-strip">
                        <strong>English Meaning (Machine Approximation):</strong> <span>{teacherTranslation.english}</span>
                      </div>
                    )}

                    {/* Transparency & Unofficial Endpoint Notice */}
                    <div className="pedagogy-tip-strip" style={{ background: '#FEF3C7', borderColor: '#FCD34D', color: '#78350F', flexDirection: 'column', alignItems: 'flex-start', gap: '0.35rem' }}>
                      <div>
                        <strong>⚠️ Unverified Machine Output:</strong>{' '}
                        <span>{teacherTranslation.accuracyDisclaimer}</span>
                      </div>
                      <div style={{ fontSize: '0.78rem', opacity: 0.9 }}>
                        <strong>Source:</strong> {teacherTranslation.providerLabel} — <em>{teacherTranslation.scriptCheckNote}</em>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="unverified-safeguard-card animate-fade-in">
                    <div className="safeguard-badge-row">
                      <span className="safeguard-badge">🛡️ सटीकता सुरक्षा (Accuracy Policy)</span>
                      <span className="demo-mode-tag">Translation Unavailable — Fallback Active</span>
                    </div>
                    
                    <div className="unverified-card-header">
                      <span className="warning-symbol">⚠️</span>
                      <div>
                        <h4>वाक्य का अनुवाद उपलब्ध नहीं हो सका (Translation Unavailable)</h4>
                        <p className="unverified-input-echo">
                          आपने दर्ज किया: <strong>"{teacherHindiText}"</strong>
                        </p>
                      </div>
                    </div>

                    <p className="safeguard-description">
                      {teacherTranslation.explanation}
                    </p>

                    <div className="primer-recommendations-section">
                      <span className="rec-title">सत्यापित प्राथमिक वाक्य चुनें (Try a Verified Classroom Sentence):</span>
                      <div className="rec-chips-wrap">
                        {SAMPLE_PROMPTS.slice(0, 6).map((p, i) => (
                          <button
                            key={i}
                            type="button"
                            className="btn-rec-chip"
                            onClick={() => {
                              setTeacherHindiText(p.text);
                              handleTranslateTeacher(p.text);
                            }}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="safeguard-api-footer">
                      <span>किसी भी मनचाहे वाक्य का AI अनुवाद करने के लिए:</span>
                      <button type="button" className="btn-link" onClick={onOpenApiGuide}>
                        View AI Engine Architecture ➔
                      </button>
                    </div>
                  </div>
                )
              ) : (
                <div className="empty-box-state">
                  <span>Speak or enter a Hindi sentence above to see the Santhali translation here.</span>
                </div>
              )}

              {/* SANTHALI MICROPHONE & SANTHALI-TO-HINDI INPUT INSIDE SANTHALI CLASSROOM TRANSLATION SECTION */}
              {activeMode === 'teacher' && (
                <div className="santhali-inline-speech-panel" style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1.5px dashed var(--border-subtle)' }}>
                  <div className="box-header-row">
                    <label htmlFor="santhali-classroom-speech-input" className="box-label">
                      <span className="step-circle step-teal">🎤</span>
                      <span>Santhali Speech & Text Input (संथाली बोलें या लिखें ➔ हिंदी अनुवाद):</span>
                    </label>

                    <div className="mic-actions-group">
                      {isStudentListening ? (
                        <button
                          type="button"
                          className="btn-mic-active pulse-mic student-mic"
                          onClick={stopStudentListening}
                          title="Stop Santhali microphone recording"
                        >
                          <span className="mic-symbol">⏹</span>
                          <span>Stop Listening</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn-mic-start student-mic-btn"
                          onClick={startStudentListening}
                          title="Click to speak Santhali using microphone (language code: sat)"
                        >
                          <span>Speak Santhali 🎤</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Active Listening Indicator */}
                  {isStudentListening && (
                    <div className="live-listening-banner student-listening-banner animate-fade-in" role="status">
                      <span className="pulsing-record-dot teal-dot"></span>
                      <strong>Listening for Santhali (code: "sat")... संथाली में बोलें</strong>
                      <div className="mini-sound-waves">
                        <span className="wave-bar w-1"></span>
                        <span className="wave-bar w-2"></span>
                        <span className="wave-bar w-3"></span>
                      </div>
                    </div>
                  )}

                  {/* Honest Browser Support Check Notice for 'sat' */}
                  {santhaliSpeechStatus && (
                    <div className="alert-message error-alert animate-fade-in" role="status" style={{ marginBottom: '0.75rem', background: '#FFFBEB', borderColor: '#F59E0B', color: '#92400E' }}>
                      <span className="alert-icon">ℹ️</span>
                      <div className="alert-body">
                        <p>{santhaliSpeechStatus}</p>
                      </div>
                      <button type="button" className="btn-alert-dismiss" onClick={() => setSanthaliSpeechStatus('')}>✕</button>
                    </div>
                  )}

                  {/* Editable Santhali Text Input Area */}
                  <div className="textarea-wrapper">
                    <textarea
                      id="santhali-classroom-speech-input"
                      className="speech-textarea"
                      rows={2}
                      value={studentSanthaliText}
                      onChange={(e) => {
                        setStudentSanthaliText(e.target.value);
                        if (studentError) setStudentError('');
                      }}
                      placeholder="संथाली वाक्य बोलें या यहाँ टाइप करें (जैसे: Johar machet / ᱡᱚᱦᱟᱨ ᱢᱟᱪᱮᱛ)..."
                    />
                    <div className="textarea-meta-bar">
                      <span className="hint-text">✏️ Manual Santhali input is always available (Roman, Ol Chiki, or Devanagari).</span>
                      <button
                        type="button"
                        className="btn-action-small btn-student-action"
                        onClick={() => handleTranslateStudent(studentSanthaliText)}
                        disabled={isStudentLoading}
                      >
                        {isStudentLoading ? 'Translating...' : 'Translate to Hindi / हिंदी अनुवाद ➔'}
                      </button>
                    </div>
                  </div>

                  {/* Quick Santhali Prompts */}
                  <div className="quick-prompts-row">
                    <span className="prompts-title">⚡ Sample Santhali Phrases (संथाली वाक्य):</span>
                    <div className="prompts-chips-wrap">
                      {STUDENT_SAMPLE_PROMPTS.slice(0, 4).map((p, i) => (
                        <button
                          key={i}
                          type="button"
                          className="btn-prompt-chip student-chip"
                          onClick={() => {
                            setStudentSanthaliText(p.text);
                            handleTranslateStudent(p.text);
                          }}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Santhali Mic / Input Error Notice */}
                  {studentError && (
                    <div className="alert-message error-alert animate-shake" role="alert">
                      <span className="alert-icon">⚠️</span>
                      <div className="alert-body">
                        <p>{studentError}</p>
                      </div>
                      <button type="button" className="btn-alert-dismiss" onClick={() => setStudentError('')}>✕</button>
                    </div>
                  )}

                  {/* Santhali -> Hindi Translation Output */}
                  {studentTranslation && (
                    <div style={{ marginTop: '0.9rem' }}>
                      <div className="box-header-row" style={{ marginBottom: '0.5rem' }}>
                        <div className="box-label">
                          <span className="step-circle step-amber">➔</span>
                          <span>Hindi Translation of Santhali Input (संथाली का हिंदी अनुवाद):</span>
                        </div>
                        {(studentTranslation.isVerified || studentTranslation.isMachineTranslated) && (
                          <button
                            type="button"
                            className={`btn-audio-playback hindi-audio-btn ${isStudentSpeaking ? 'audio-active' : ''}`}
                            onClick={handleSpeakHindi}
                            aria-label="Play translated Hindi audio"
                          >
                            <span className="audio-icon">{isStudentSpeaking ? '⏹' : '🔊'}</span>
                            <span>{isStudentSpeaking ? 'Stop Audio' : 'Play Hindi Audio'}</span>
                          </button>
                        )}
                      </div>

                      {/* Student Hindi Audio Speech Feedback */}
                      {speechNotice && (isStudentSpeaking || speechNotice.includes('translated Hindi')) && (
                        <div className="speech-inline-feedback animate-fade-in" role="status" style={{ marginBottom: '0.6rem' }}>
                          <span>{speechNotice}</span>
                          <button type="button" className="btn-alert-dismiss" onClick={() => setSpeechNotice('')}>✕</button>
                        </div>
                      )}

                      {studentTranslation.isVerified ? (
                        <div className="translation-display-card student-result-card animate-fade-in">
                          <div className="result-badge-row">
                            <span className="badge-pill badge-verified">✓ {studentTranslation.verificationBadge || 'Verified Student Expression'}</span>
                            <span className="badge-script">Santhali ➔ Hindi (हिंदी)</span>
                          </div>
                          <div className="hindi-screen-highlight">
                            {studentTranslation.hindiTranslation}
                          </div>
                          <div className="phonetics-dual-row">
                            <div className="phonetic-col">
                              <span className="phonetic-tag">Ol Chiki Script (ᱚᱞ ᱪᱤᱠᱤ):</span>
                              <p className="phonetic-val ol-chiki-val">{studentTranslation.santhaliOlChiki}</p>
                            </div>
                            <div className="phonetic-col">
                              <span className="phonetic-tag">Roman / Phonetic:</span>
                              <p className="phonetic-val">{studentTranslation.santhaliRoman}</p>
                            </div>
                          </div>
                          <div className="meaning-strip">
                            <strong>English Meaning:</strong> <span>{studentTranslation.englishMeaning}</span>
                          </div>
                        </div>
                      ) : studentTranslation.isMachineTranslated ? (
                        <div className="translation-display-card student-result-card animate-fade-in" style={{ borderColor: '#F59E0B', background: '#FFFDF7' }}>
                          <div className="result-badge-row">
                            <span className="badge-pill" style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #F59E0B', fontWeight: 700 }}>
                              ⚠️ Unverified Machine Translation (Prototype)
                            </span>
                            <span className="badge-script">Santhali ➔ Hindi (हिंदी)</span>
                          </div>
                          <div className="hindi-screen-highlight">
                            {studentTranslation.hindiTranslation}
                          </div>
                          <div className="pedagogy-tip-strip" style={{ background: '#FEF3C7', borderColor: '#FCD34D', color: '#78350F' }}>
                            <span>{studentTranslation.teacherAdvice} ({studentTranslation.providerLabel})</span>
                          </div>
                        </div>
                      ) : (
                        <div className="unverified-safeguard-card animate-fade-in">
                          <div className="safeguard-badge-row">
                            <span className="safeguard-badge">🛡️ सटीकता सुरक्षा (Accuracy Policy)</span>
                            <span className="demo-mode-tag">Curated Primer Lookup</span>
                          </div>
                          <div className="unverified-card-header">
                            <span className="warning-symbol">⚠️</span>
                            <div>
                              <h4>संथाली वाक्य प्राथमिक प्राइमर में उपलब्ध नहीं है (Not in Verified Lexicon)</h4>
                              <p className="unverified-input-echo">
                                आपने दर्ज किया: <strong>"{studentSanthaliText}"</strong>
                              </p>
                            </div>
                          </div>
                          <p className="safeguard-description">
                            {studentTranslation.teacherAdvice}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ================================================================= */}
        {/* PANEL 2: STUDENT'S SANTHALI SPEECH ➔ HINDI TRANSLATION            */}
        {/* ================================================================= */}
        {(activeMode === 'student' || activeMode === 'dual') && (
          <section className="speech-direction-card student-card" aria-label="Student Santhali to Hindi Translator">
            <div className="card-top-banner student-banner">
              <div className="banner-title-wrap">
                <span className="banner-badge student-badge">🧒 Student Mode (छात्र संवाद)</span>
                <h3>Student Santhali Speech ➔ Hindi Translation</h3>
              </div>
              <span className="direction-flow-pill student-flow">Santhali ➔ Hindi</span>
            </div>

            {/* 1. RECOGNIZED SANTHALI SPEECH BOX (EDITABLE) */}
            <div className="box-section input-speech-box">
              <div className="box-header-row">
                <label htmlFor="student-speech-input" className="box-label">
                  <span className="step-circle step-teal">1</span>
                  <span>Student's Recognized Santhali Speech (छात्र की बोली गई संथाली):</span>
                </label>

                {/* Microphone Toggle Button */}
                <div className="mic-actions-group">
                  {isStudentListening ? (
                    <button
                      type="button"
                      className="btn-mic-active pulse-mic student-mic"
                      onClick={stopStudentListening}
                      title="Stop microphone recording"
                    >
                      <span className="mic-symbol">⏹</span>
                      <span>Stop Listening</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn-mic-start student-mic-btn"
                      onClick={startStudentListening}
                      title="Click to speak Santhali words using microphone (language code: sat)"
                    >
                      <span>Speak Santhali 🎤</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Active Listening Indicator */}
              {isStudentListening && (
                <div className="live-listening-banner student-listening-banner animate-fade-in" role="status">
                  <span className="pulsing-record-dot teal-dot"></span>
                  <strong>Listening for Santhali (code: "sat")... बच्चा संथाली में बोल सकता है</strong>
                  <div className="mini-sound-waves">
                    <span className="wave-bar w-1"></span>
                    <span className="wave-bar w-2"></span>
                    <span className="wave-bar w-3"></span>
                  </div>
                </div>
              )}

              {/* Honest Browser Support Check Notice for 'sat' */}
              {santhaliSpeechStatus && (
                <div className="alert-message error-alert animate-fade-in" role="status" style={{ marginBottom: '0.75rem', background: '#FFFBEB', borderColor: '#F59E0B', color: '#92400E' }}>
                  <span className="alert-icon">ℹ️</span>
                  <div className="alert-body">
                    <p>{santhaliSpeechStatus}</p>
                  </div>
                  <button type="button" className="btn-alert-dismiss" onClick={() => setSanthaliSpeechStatus('')}>✕</button>
                </div>
              )}

              {/* Editable Textarea for Recognized Santhali Speech */}
              <div className="textarea-wrapper">
                <textarea
                  id="student-speech-input"
                  className="speech-textarea"
                  rows={3}
                  value={studentSanthaliText}
                  onChange={(e) => {
                    setStudentSanthaliText(e.target.value);
                    if (studentError) setStudentError('');
                  }}
                  placeholder="यहाँ छात्र का संथाली वाक्य दिखाई देगा (जैसे: Johar machet / ᱡᱚᱦᱟᱨ ᱢᱟᱪᱮᱛ)..."
                />
                <div className="textarea-meta-bar">
                  <span className="hint-text">✏️ You can edit or type student Santhali words (Roman or Ol Chiki).</span>
                  <button
                    type="button"
                    className="btn-action-small btn-student-action"
                    onClick={() => handleTranslateStudent(studentSanthaliText)}
                    disabled={isStudentLoading}
                  >
                    {isStudentLoading ? 'Translating...' : 'Translate to Hindi / हिंदी अनुवाद ➔'}
                  </button>
                </div>
              </div>

              {/* Quick Santhali Student Prompts */}
              <div className="quick-prompts-row">
                <span className="prompts-title">⚡ Common Student Expressions (छात्र अभिव्यक्ति):</span>
                <div className="prompts-chips-wrap">
                  {STUDENT_SAMPLE_PROMPTS.slice(0, 4).map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      className="btn-prompt-chip student-chip"
                      onClick={() => {
                        setStudentSanthaliText(p.text);
                        handleTranslateStudent(p.text);
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error Notice */}
              {studentError && (
                <div className="alert-message error-alert animate-shake" role="alert">
                  <span className="alert-icon">⚠️</span>
                  <div className="alert-body">
                    <p>{studentError}</p>
                  </div>
                  <button type="button" className="btn-alert-dismiss" onClick={() => setStudentError('')}>✕</button>
                </div>
              )}
            </div>

            {/* 2. TRANSLATED HINDI TEXT BOX (SEPARATE BOX BELOW) */}
            <div className="box-section translation-result-box">
              <div className="box-header-row">
                <div className="box-label">
                  <span className="step-circle step-amber">2</span>
                  <span>Hindi Translation for Teacher (शिक्षक के लिए हिंदी अनुवाद):</span>
                </div>

                {studentTranslation && (studentTranslation.isVerified || studentTranslation.isMachineTranslated) && (
                  <button
                    type="button"
                    className={`btn-audio-playback hindi-audio-btn ${isStudentSpeaking ? 'audio-active' : ''}`}
                    onClick={handleSpeakHindi}
                    aria-label="Play translated Hindi audio"
                  >
                    <span className="audio-icon">{isStudentSpeaking ? '⏹' : '🔊'}</span>
                    <span>{isStudentSpeaking ? 'Stop Audio' : 'Play Hindi Audio'}</span>
                  </button>
                )}
              </div>

              {isStudentLoading ? (
                <div className="loading-card">
                  <div className="spinner-circle"></div>
                  <span>Translating student Santhali to standard Hindi...</span>
                </div>
              ) : studentTranslation ? (
                studentTranslation.isVerified ? (
                  <div className="translation-display-card student-result-card animate-fade-in">
                    {/* Verified Badge */}
                    <div className="result-badge-row">
                      <span className="badge-pill badge-verified">
                        ✓ Verified Student Expression
                      </span>
                      <span className="badge-script">Hindi (हिंदी)</span>
                    </div>

                    {/* Primary Hindi Translation Text Display */}
                    <div className="hindi-screen-highlight">
                      {studentTranslation.hindiTranslation}
                    </div>

                    {/* Santhali Original Representation */}
                    <div className="phonetics-dual-row">
                      <div className="phonetic-col">
                        <span className="phonetic-tag">Ol Chiki Script (ᱚᱞ ᱪᱤᱠᱤ):</span>
                        <p className="phonetic-val ol-chiki-val">{studentTranslation.santhaliOlChiki}</p>
                      </div>
                      <div className="phonetic-col">
                        <span className="phonetic-tag">Roman / Phonetic:</span>
                        <p className="phonetic-val">{studentTranslation.santhaliRoman}</p>
                      </div>
                    </div>

                    {/* English Meaning & Teacher Context */}
                    <div className="meaning-strip">
                      <strong>English Meaning:</strong> <span>{studentTranslation.englishMeaning}</span>
                    </div>

                    <div className="pedagogy-tip-strip student-advice-strip">
                      <span className="tip-star">🤝</span>
                      <span><strong>Teacher Advice:</strong> {studentTranslation.teacherAdvice}</span>
                    </div>
                  </div>
                ) : studentTranslation.isMachineTranslated ? (
                  <div className="translation-display-card student-result-card animate-fade-in" style={{ borderColor: '#F59E0B', background: '#FFFDF7' }}>
                    <div className="result-badge-row">
                      <span className="badge-pill" style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #F59E0B', fontWeight: 700 }}>
                        ⚠️ Unverified Machine Translation (Prototype)
                      </span>
                      <span className="badge-script">Santhali ➔ Hindi (हिंदी)</span>
                    </div>
                    <div className="hindi-screen-highlight">
                      {studentTranslation.hindiTranslation}
                    </div>
                    <div className="pedagogy-tip-strip" style={{ background: '#FEF3C7', borderColor: '#FCD34D', color: '#78350F' }}>
                      <span>{studentTranslation.teacherAdvice} ({studentTranslation.providerLabel})</span>
                    </div>
                  </div>
                ) : (
                  <div className="unverified-safeguard-card animate-fade-in">
                    <div className="safeguard-badge-row">
                      <span className="safeguard-badge">🛡️ सटीकता सुरक्षा (Accuracy Policy)</span>
                      <span className="demo-mode-tag">Curated Primer Lookup</span>
                    </div>

                    <div className="unverified-card-header">
                      <span className="warning-symbol">⚠️</span>
                      <div>
                        <h4>संथाली वाक्य प्राथमिक प्राइमर में उपलब्ध नहीं है (Not in Verified Lexicon)</h4>
                        <p className="unverified-input-echo">
                          आपने दर्ज किया: <strong>"{studentSanthaliText}"</strong>
                        </p>
                      </div>
                    </div>

                    <p className="safeguard-description">
                      सटीकता सुरक्षा: मनगढ़ंत या गलत अनुवाद प्रदर्शित करने से बचने के लिए, हमने कोई असंबंधित हिंदी अनुवाद नहीं दिखाया है। यह प्रोटोटाइप प्राथमिक कक्षा प्राइमर के सत्यापित संथाली वाक्यों पर आधारित है।
                    </p>

                    <div className="primer-recommendations-section">
                      <span className="rec-title">सत्यापित छात्र अभिव्यक्तियों में से चुनें (Try a Verified Student Expression):</span>
                      <div className="rec-chips-wrap">
                        {STUDENT_SAMPLE_PROMPTS.slice(0, 6).map((p, i) => (
                          <button
                            key={i}
                            type="button"
                            className="btn-rec-chip student-rec-chip"
                            onClick={() => {
                              setStudentSanthaliText(p.text);
                              handleTranslateStudent(p.text);
                            }}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="safeguard-api-footer">
                      <span>किसी भी संथाली वाक्य का संपूर्ण AI अनुवाद करने के लिए:</span>
                      <button type="button" className="btn-link" onClick={onOpenApiGuide}>
                        Connect Bhashini / IndicTrans2 API ➔
                      </button>
                    </div>
                  </div>
                )
              ) : (
                <div className="empty-box-state">
                  <span>Speak or enter a student Santhali phrase above to see the Hindi translation here.</span>
                </div>
              )}
            </div>
          </section>
        )}

      </div>

      {/* Global Speech Status Pill */}
      {speechNotice && (
        <div className="speech-global-notice animate-fade-in">
          <span>{speechNotice}</span>
          <button type="button" className="btn-alert-dismiss" onClick={() => setSpeechNotice('')}>✕</button>
        </div>
      )}
    </div>
  );
}
