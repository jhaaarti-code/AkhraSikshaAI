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
import { speakText, stopSpeech } from '../services/speechService';
import { speechRecognizer, isSpeechRecognitionSupported } from '../services/speechRecognitionService';

export default function TranslatorSection({ onOpenApiGuide }) {
  // Mode: 'teacher' (Hindi -> Santhali), 'student' (Santhali -> Hindi), or 'dual' (Both together)
  const [activeMode, setActiveMode] = useState('teacher');

  // Teacher State (Hindi -> Santhali)
  const [teacherHindiText, setTeacherHindiText] = useState('नमस्ते बच्चों, कक्षा में आपका स्वागत है');
  const [teacherTranslation, setTeacherTranslation] = useState(null);
  const [isTeacherLoading, setIsTeacherLoading] = useState(false);
  const [isTeacherListening, setIsTeacherListening] = useState(false);
  const [teacherError, setTeacherError] = useState('');
  const [isTeacherSpeaking, setIsTeacherSpeaking] = useState(false);

  // Student State (Santhali -> Hindi)
  const [studentSanthaliText, setStudentSanthaliText] = useState('Johar machet');
  const [studentTranslation, setStudentTranslation] = useState(null);
  const [isStudentLoading, setIsStudentLoading] = useState(false);
  const [isStudentListening, setIsStudentListening] = useState(false);
  const [studentError, setStudentError] = useState('');
  const [isStudentSpeaking, setIsStudentSpeaking] = useState(false);

  // Target Tribal Language Selection
  const [selectedLanguage, setSelectedLanguage] = useState('sat');
  const [copiedKey, setCopiedKey] = useState('');
  const [speechNotice, setSpeechNotice] = useState('');

  // Initial translation on component mount
  useEffect(() => {
    handleTranslateTeacher(teacherHindiText);
    handleTranslateStudent(studentSanthaliText);

    return () => {
      speechRecognizer.stop();
      stopSpeech();
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
    setIsTeacherSpeaking(false);

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
    setIsTeacherSpeaking(false);

    if (!isSpeechRecognitionSupported()) {
      setTeacherError('⚠️ आपके ब्राउज़र में माइक्रोफ़ोन स्पीच रिकग्निशन समर्थित नहीं है। कृपया Google Chrome का उपयोग करें या नीचे दिए गए त्वरित वाक्य चुनें।');
      return;
    }

    const started = speechRecognizer.start({
      mode: 'teacher',
      lang: 'hi-IN',
      onStart: () => {
        setIsTeacherListening(true);
      },
      onResult: ({ rawText, finalTranscript }) => {
        const textToUse = finalTranscript || rawText;
        if (textToUse) {
          setTeacherHindiText(textToUse);
          handleTranslateTeacher(textToUse);
        }
      },
      onError: (errMsg) => {
        setIsTeacherListening(false);
        setTeacherError(errMsg);
      },
      onEnd: () => {
        setIsTeacherListening(false);
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

  const handleSpeakSanthali = () => {
    if (isTeacherSpeaking) {
      stopSpeech();
      setIsTeacherSpeaking(false);
      return;
    }

    if (!teacherTranslation) return;
    setSpeechNotice('');

    const res = speakText({
      text: teacherTranslation.santhaliRoman || teacherTranslation.santhaliDevanagari,
      langCode: selectedLanguage,
      romanPhonetic: teacherTranslation.santhaliRoman || '',
      devanagariPhonetic: teacherTranslation.santhaliDevanagari || '',
      onStart: () => setIsTeacherSpeaking(true),
      onEnd: () => setIsTeacherSpeaking(false),
      onError: () => {
        setIsTeacherSpeaking(false);
        setSpeechNotice('⚠️ ब्राउज़र स्पीच इंजन इस उच्चारण का समर्थन नहीं कर रहा (TTS voice unavailable).');
      }
    });

    if (res?.voiceInfo && !res.voiceInfo.isNative) {
      setSpeechNotice(`📢 ध्वनि सूचना: ${res.voiceInfo.label} का उपयोग करके उच्चारण किया गया।`);
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
      setStudentError('⚠️ कृपया छात्र का संथाली वाक्य दर्ज करें या माइक पर बोलें (Please enter or speak a Santhali sentence).');
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

  const startStudentListening = () => {
    setStudentError('');
    stopSpeech();
    setIsStudentSpeaking(false);

    if (!isSpeechRecognitionSupported()) {
      setStudentError('⚠️ आपके ब्राउज़र में माइक्रोफ़ोन स्पीच रिकग्निशन समर्थित नहीं है। कृपया Google Chrome का उपयोग करें या नीचे दिए गए त्वरित संथाली वाक्य चुनें।');
      return;
    }

    const started = speechRecognizer.start({
      mode: 'student',
      // Web Speech API uses standard hi-IN or en-IN for phonetics
      lang: 'hi-IN',
      onStart: () => {
        setIsStudentListening(true);
      },
      onResult: ({ rawText, finalTranscript }) => {
        const textToUse = finalTranscript || rawText;
        if (textToUse) {
          setStudentSanthaliText(textToUse);
          handleTranslateStudent(textToUse);
        }
      },
      onError: (errMsg) => {
        setIsStudentListening(false);
        setStudentError(errMsg);
      },
      onEnd: () => {
        setIsStudentListening(false);
      }
    });

    if (!started) {
      setIsStudentListening(false);
    }
  };

  const stopStudentListening = () => {
    speechRecognizer.stop();
    setIsStudentListening(false);
  };

  const handleSpeakHindi = () => {
    if (isStudentSpeaking) {
      stopSpeech();
      setIsStudentSpeaking(false);
      return;
    }

    if (!studentTranslation) return;
    setSpeechNotice('');

    speakText({
      text: studentTranslation.hindiTranslation,
      langCode: 'hi',
      onStart: () => setIsStudentSpeaking(true),
      onEnd: () => setIsStudentSpeaking(false),
      onError: () => {
        setIsStudentSpeaking(false);
        setSpeechNotice('⚠️ हिंदी स्पीच इंजन अनुपलब्ध है (Hindi speech engine unavailable).');
      }
    });
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

                {teacherTranslation && (
                  <button
                    type="button"
                    className={`btn-audio-playback ${isTeacherSpeaking ? 'audio-active' : ''}`}
                    onClick={handleSpeakSanthali}
                    aria-label="Play translated Santhali audio"
                  >
                    <span className="audio-icon">{isTeacherSpeaking ? '⏹' : '🔊'}</span>
                    <span>{isTeacherSpeaking ? 'Stop Audio' : 'Play Santhali Audio'}</span>
                  </button>
                )}
              </div>

              {isTeacherLoading ? (
                <div className="loading-card">
                  <div className="spinner-circle"></div>
                  <span>Translating Hindi to verified Santhali Ol Chiki...</span>
                </div>
              ) : teacherTranslation ? (
                <div className="translation-display-card animate-fade-in">
                  {/* Verified or Demo Badge */}
                  <div className="result-badge-row">
                    <span className={`badge-pill ${teacherTranslation.isVerified ? 'badge-verified' : 'badge-demo'}`}>
                      {teacherTranslation.isVerified ? '✓ Verified Primer Match' : '⚠️ Demo Sandbox Mode'}
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

                  {/* Unverified Custom Input Warning */}
                  {teacherTranslation.isDemoSimulation && (
                    <div className="demo-integrity-box">
                      <p>{teacherTranslation.demoNotice}</p>
                      <button type="button" className="btn-link" onClick={onOpenApiGuide}>
                        Connect Bhashini / IndicTrans2 API ➔
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="empty-box-state">
                  <span>Speak or enter a Hindi sentence above to see the Santhali translation here.</span>
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
                      title="Click to speak Santhali words using microphone"
                    >
                      <span className="mic-symbol">🎙️</span>
                      <span>Speak Santhali (संथाली बोलें)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Active Listening Indicator */}
              {isStudentListening && (
                <div className="live-listening-banner student-listening-banner animate-fade-in" role="status">
                  <span className="pulsing-record-dot teal-dot"></span>
                  <strong>Listening now... बच्चा संथाली में बोल सकता है (Speak Santhali)</strong>
                  <div className="mini-sound-waves">
                    <span className="wave-bar w-1"></span>
                    <span className="wave-bar w-2"></span>
                    <span className="wave-bar w-3"></span>
                  </div>
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

                {studentTranslation && (
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
                <div className="translation-display-card student-result-card animate-fade-in">
                  {/* Verified Badge */}
                  <div className="result-badge-row">
                    <span className={`badge-pill ${studentTranslation.isVerified ? 'badge-verified' : 'badge-demo'}`}>
                      {studentTranslation.isVerified ? '✓ Verified Student Expression' : '⚠️ Demo Sandbox Mode'}
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

                  {/* Unverified Notice */}
                  {studentTranslation.isDemoSimulation && (
                    <div className="demo-integrity-box">
                      <p>{studentTranslation.demoNotice}</p>
                      <button type="button" className="btn-link" onClick={onOpenApiGuide}>
                        Connect Bhashini / IndicTrans2 API ➔
                      </button>
                    </div>
                  )}
                </div>
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
