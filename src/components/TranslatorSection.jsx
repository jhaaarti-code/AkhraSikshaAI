import React, { useState, useEffect } from 'react';
import { SUPPORTED_LANGUAGES } from '../data/languages';
import { SAMPLE_PROMPTS } from '../data/curatedPhrases';
import { translateHindiToTribal } from '../services/translatorService';
import { speakText, stopSpeech } from '../services/speechService';

export default function TranslatorSection({ onOpenApiGuide }) {
  const [inputText, setInputText] = useState('नमस्ते बच्चों, कक्षा में आपका स्वागत है');
  const [selectedLanguage, setSelectedLanguage] = useState('sat');
  const [isLoading, setIsLoading] = useState(false);
  const [translationResult, setTranslationResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechNotice, setSpeechNotice] = useState('');
  const [copiedField, setCopiedField] = useState('');

  // Initial load: translate the initial default sentence
  useEffect(() => {
    handleTranslate(inputText);
  }, []);

  const handleTranslate = async (textToTranslate = inputText) => {
    const text = (textToTranslate || '').trim();
    setErrorMessage('');
    setSpeechNotice('');

    if (!text) {
      setErrorMessage('⚠️ कृपया अनुवाद के लिए कोई हिंदी वाक्य दर्ज करें (Please enter a Hindi classroom sentence).');
      setTranslationResult(null);
      return;
    }

    setIsLoading(true);
    stopSpeech();
    setIsSpeaking(false);

    try {
      const result = await translateHindiToTribal({
        text,
        targetLanguageCode: selectedLanguage
      });
      setTranslationResult(result);
    } catch (err) {
      setErrorMessage(err.message || 'अनुवाद प्रक्रिया में त्रुटि हुई (Translation process failed).');
      setTranslationResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSampleClick = (promptText) => {
    setInputText(promptText);
    setErrorMessage('');
    handleTranslate(promptText);
  };

  const handleClear = () => {
    setInputText('');
    setTranslationResult(null);
    setErrorMessage('');
    stopSpeech();
    setIsSpeaking(false);
  };

  const handleSpeak = (textToSpeak, isHindi = false) => {
    if (isSpeaking) {
      stopSpeech();
      setIsSpeaking(false);
      return;
    }

    setSpeechNotice('');
    const langCode = isHindi ? 'hi' : selectedLanguage;

    const res = speakText({
      text: textToSpeak,
      langCode,
      romanPhonetic: translationResult?.santhaliRoman || '',
      devanagariPhonetic: translationResult?.santhaliDevanagari || '',
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: (err) => {
        setIsSpeaking(false);
        setSpeechNotice('⚠️ आपका ब्राउज़र इस ध्वनि इंजन का समर्थन नहीं कर रहा (Speech synthesis unavailable on this device).');
      }
    });

    if (res && res.voiceInfo && !res.voiceInfo.isNative && !isHindi) {
      setSpeechNotice(`📢 ध्वनि सूचना: ${res.voiceInfo.label} का उपयोग करके उच्चारण किया गया।`);
    }
  };

  const handleCopy = (content, fieldName) => {
    if (!content) return;
    navigator.clipboard.writeText(content).then(() => {
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(''), 2200);
    }).catch(() => {
      // Fallback
    });
  };

  const currentLangObj = SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage) || SUPPORTED_LANGUAGES[0];

  return (
    <div className="translator-wrapper">
      {/* Upper Control Bar: Language Selectors */}
      <div className="lang-bar-card">
        <div className="lang-selector-group">
          <div className="lang-badge-source">
            <span className="lang-role-tag">Source Language:</span>
            <div className="lang-pill active-pill">
              <span className="lang-flag">🇮🇳</span>
              <strong>Hindi (हिंदी)</strong>
            </div>
          </div>

          <div className="lang-arrow-wrap">
            <span className="lang-arrow">➔</span>
          </div>

          <div className="lang-badge-target">
            <label htmlFor="target-lang-select" className="lang-role-tag">Target Tribal Language:</label>
            <div className="select-container">
              <select
                id="target-lang-select"
                className="select-dropdown"
                value={selectedLanguage}
                onChange={(e) => {
                  setSelectedLanguage(e.target.value);
                  setErrorMessage('');
                }}
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name} {lang.status === 'roadmap' ? `(${lang.tag})` : '— Ol Chiki'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="target-lang-meta">
          <span className="meta-item">
            <strong>Script:</strong> {currentLangObj.nativeScript}
          </span>
          <span className="meta-item">
            <strong>Regions:</strong> {currentLangObj.state}
          </span>
          <span className={`status-chip ${currentLangObj.status}`}>
            {currentLangObj.statusLabel}
          </span>
        </div>
      </div>

      {/* Main Dual Workspace Grid */}
      <div className="translator-workspace">
        {/* Left Side: Teacher's Hindi Input Box */}
        <div className="card-panel input-panel">
          <div className="panel-header">
            <div className="panel-title-wrap">
              <span className="panel-icon">✍️</span>
              <div>
                <h3 className="panel-title">Classroom Hindi Sentence</h3>
                <p className="panel-subtitle">शिक्षक का हिंदी वाक्य</p>
              </div>
            </div>

            {inputText && (
              <button 
                type="button" 
                className="btn-text-action" 
                onClick={handleClear}
                title="Clear input"
              >
                Clear / मिटाएं
              </button>
            )}
          </div>

          <div className="textarea-container">
            <textarea
              className="sentence-textarea"
              rows={4}
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              placeholder="उदाहरण: सभी बच्चे बैठ जाएं / अपनी किताब खोलो..."
              aria-label="Enter Hindi classroom sentence"
            />
            <div className="textarea-footer">
              <span className="char-count">{inputText.length} अक्षर (characters)</span>
              {inputText.trim() && (
                <button
                  type="button"
                  className="btn-mini-audio"
                  onClick={() => handleSpeak(inputText, true)}
                  title="Listen to Hindi sentence"
                >
                  🔊 Listen Hindi
                </button>
              )}
            </div>
          </div>

          {/* Quick Classroom Sentence Chips */}
          <div className="sample-chips-section">
            <div className="chips-title-row">
              <span className="chips-label">⚡ One-Click Teacher Prompts (त्वरित प्राथमिक वाक्य):</span>
            </div>
            <div className="chips-container" role="group" aria-label="Sample classroom sentences">
              {SAMPLE_PROMPTS.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`chip-btn ${inputText === sample.text ? 'chip-active' : ''}`}
                  onClick={() => handleSampleClick(sample.text)}
                >
                  {sample.label}
                </button>
              ))}
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="panel-action-bar">
            <button
              type="button"
              className={`btn-primary-translate ${isLoading ? 'loading' : ''}`}
              onClick={() => handleTranslate(inputText)}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner-dot"></span>
                  <span>Translating / अनुवाद हो रहा है...</span>
                </>
              ) : (
                <>
                  <span className="btn-icon">✨</span>
                  <span>Translate to {currentLangObj.name.split(' ')[0]} / अनुवाद करें</span>
                </>
              )}
            </button>
          </div>

          {/* Error Alert Message */}
          {errorMessage && (
            <div className="alert-box error-alert animate-shake" role="alert">
              <span className="alert-icon">⚠️</span>
              <div className="alert-content">
                <strong>त्रुटि (Validation Note):</strong>
                <p>{errorMessage}</p>
              </div>
              <button 
                type="button" 
                className="alert-close" 
                onClick={() => setErrorMessage('')}
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Translation Output Card */}
        <div className="card-panel output-panel">
          <div className="panel-header">
            <div className="panel-title-wrap">
              <span className="panel-icon">🎯</span>
              <div>
                <h3 className="panel-title">Santhali Classroom Translation</h3>
                <p className="panel-subtitle">संथाली कक्षा अनुवाद एवं उच्चारण मार्गदर्शिका</p>
              </div>
            </div>

            {translationResult && (
              <div className="status-indicator-wrap">
                {translationResult.isVerified ? (
                  <span className="badge-verified">
                    <span className="badge-dot"></span>
                    Verified Primer
                  </span>
                ) : (
                  <span className="badge-demo">
                    <span className="badge-dot-demo"></span>
                    Demo Sandbox Mode
                  </span>
                )}
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="output-loading-state">
              <div className="pulse-loader"></div>
              <p>Fetching verified Santhali classroom lexicon...</p>
              <span className="sub-loader-text">Comparing against Ol Chiki primary education primer</span>
            </div>
          ) : translationResult ? (
            <div className="output-content animate-fade-in">
              {/* Primary Ol Chiki Box */}
              <div className="ol-chiki-highlight-card">
                <div className="script-header-row">
                  <span className="script-tag">ᱚᱞ ᱪᱤᱠᱤ (Ol Chiki Script)</span>
                  <div className="card-actions-group">
                    <button
                      type="button"
                      className={`btn-icon-action ${copiedField === 'olchiki' ? 'copied' : ''}`}
                      onClick={() => handleCopy(translationResult.santhaliOlChiki, 'olchiki')}
                      title="Copy Ol Chiki text"
                    >
                      {copiedField === 'olchiki' ? '✓ Copied' : '📋 Copy Script'}
                    </button>

                    <button
                      type="button"
                      className={`btn-speaker-prominent ${isSpeaking ? 'speaking-active' : ''}`}
                      onClick={() => handleSpeak(translationResult.santhaliRoman || translationResult.santhaliDevanagari)}
                      title="Read aloud in Santhali pronunciation"
                      aria-label="Speak Santhali translation"
                    >
                      <span className="speaker-symbol">{isSpeaking ? '⏹' : '🔊'}</span>
                      <span className="speaker-text">{isSpeaking ? 'Stop' : 'Speak'}</span>
                    </button>
                  </div>
                </div>

                <div className="ol-chiki-text-display">
                  {translationResult.santhaliOlChiki}
                </div>

                {isSpeaking && (
                  <div className="speaking-wave-bar">
                    <span className="sound-wave wave-1"></span>
                    <span className="sound-wave wave-2"></span>
                    <span className="sound-wave wave-3"></span>
                    <span className="sound-wave wave-4"></span>
                    <span className="sound-wave-text">Playing classroom pronunciation via Web Speech API...</span>
                  </div>
                )}
              </div>

              {/* Phonetic Pronunciation Guide (Roman & Devanagari) */}
              <div className="phonetic-guide-grid">
                <div className="guide-box">
                  <div className="guide-box-header">
                    <span className="guide-label">Roman / Latin Pronunciation:</span>
                    <button 
                      type="button"
                      className="btn-tiny-copy"
                      onClick={() => handleCopy(translationResult.santhaliRoman, 'roman')}
                    >
                      {copiedField === 'roman' ? '✓' : 'Copy'}
                    </button>
                  </div>
                  <p className="guide-phonetic-text roman-text">
                    {translationResult.santhaliRoman}
                  </p>
                  <span className="guide-hint">Ideal for teachers reading English alphabet</span>
                </div>

                <div className="guide-box">
                  <div className="guide-box-header">
                    <span className="guide-label">देवनागरी उच्चारण (Hindi phonetic):</span>
                    <button 
                      type="button"
                      className="btn-tiny-copy"
                      onClick={() => handleCopy(translationResult.santhaliDevanagari, 'devanagari')}
                    >
                      {copiedField === 'devanagari' ? '✓' : 'Copy'}
                    </button>
                  </div>
                  <p className="guide-phonetic-text devanagari-text">
                    {translationResult.santhaliDevanagari}
                  </p>
                  <span className="guide-hint">हिंदी माध्यम के शिक्षकों के लिए आसान उच्चारण</span>
                </div>
              </div>

              {/* English Pedagogical Meaning */}
              <div className="pedagogy-meaning-row">
                <span className="meaning-tag">English Meaning:</span>
                <span className="meaning-val">{translationResult.english}</span>
              </div>

              {/* Teacher's Cultural Tip & Usage Context */}
              <div className="teacher-tip-box">
                <div className="tip-header">
                  <span className="tip-icon">💡</span>
                  <span className="tip-title">Teacher's Pedagogical Context (शिक्षक सुझाव):</span>
                </div>
                <p className="tip-text">{translationResult.teacherTip}</p>
              </div>

              {/* Transparent Unverified Input Notice */}
              {translationResult.isDemoSimulation && (
                <div className="unverified-warning-banner">
                  <div className="warning-badge-row">
                    <span className="warning-icon">🛡️</span>
                    <strong>Linguistic Integrity / Demo Notice:</strong>
                  </div>
                  <p className="warning-body">
                    {translationResult.demoNotice}
                  </p>
                  <div className="api-hook-cta-row">
                    <span>Want to connect a production translation AI model?</span>
                    <button 
                      type="button" 
                      className="btn-link-action"
                      onClick={onOpenApiGuide}
                    >
                      View Bhashini & IndicTrans2 API Guide ➔
                    </button>
                  </div>
                </div>
              )}

              {/* Speech Engine Notice if active */}
              {speechNotice && (
                <div className="speech-info-pill">
                  {speechNotice}
                </div>
              )}
            </div>
          ) : (
            <div className="output-placeholder-empty">
              <div className="placeholder-icon">🌱</div>
              <h4>No Sentence Translated Yet</h4>
              <p>Type a Hindi sentence or click any of the quick teacher prompts to see verified Ol Chiki script and audio guidance.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
