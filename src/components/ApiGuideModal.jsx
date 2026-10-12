import React, { useState } from 'react';

export default function ApiGuideModal({ isOpen, onClose }) {
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  if (!isOpen) return null;

  const sampleApiCall = `// Example: Connecting AI4Bharat IndicTrans2 or Bhashini API
async function translateWithIndicTrans({ hindiSentence, targetLang = "sat" }) {
  const response = await fetch("https://api.bhashini.gov.in/v1/translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer YOUR_BHASHINI_API_KEY",
      "userID": "YOUR_DIGITAL_INDIA_USER_ID"
    },
    body: JSON.stringify({
      pipelineTasks: [{
        taskType: "translation",
        config: {
          language: {
            sourceLanguage: "hi",
            targetLanguage: targetLang // 'sat' for Santhali
          }
        }
      }],
      inputData: {
        input: [{ source: hindiSentence }]
      }
    })
  });

  const data = await response.json();
  return {
    olChikiText: data.pipelineResponse[0].output[0].target,
    sourceText: hindiSentence
  };
}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(sampleApiCall);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card animate-scale-up" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-row">
            <span className="modal-icon">⚡</span>
            <div>
              <h3>AI Engine Integration Architecture</h3>
              <p>How to scale AkhraSiksha AI with open-source Indic models</p>
            </div>
          </div>
          <button 
            type="button" 
            className="btn-modal-close" 
            onClick={onClose}
            aria-label="Close API Guide"
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="api-overview-banner">
            <div className="banner-badge">Hackathon Technical Transparency</div>
            <p>
              In this prototype demonstration, we use a <strong>verified, authentic Multilingual Education (MLE) classroom primer</strong> for classroom phrases to ensure 100% linguistic accuracy without hallucination. For translating arbitrary, free-form sentences at scale, production deployments connect to the Indic AI pipelines detailed below.
            </p>
          </div>

          <div className="pipeline-flow-diagram">
            <div className="step-node">
              <span className="step-num">1</span>
              <span className="step-title">Teacher Input</span>
              <span className="step-desc">Hindi text/audio</span>
            </div>
            <div className="step-connector">➔</div>
            <div className="step-node active-node">
              <span className="step-num">2</span>
              <span className="step-title">IndicTrans2 / Bhashini</span>
              <span className="step-desc">NMT Sequence Model</span>
            </div>
            <div className="step-connector">➔</div>
            <div className="step-node">
              <span className="step-num">3</span>
              <span className="step-title">Script Transliteration</span>
              <span className="step-desc">Ol Chiki + Roman</span>
            </div>
            <div className="step-connector">➔</div>
            <div className="step-node">
              <span className="step-num">4</span>
              <span className="step-title">Classroom TTS</span>
              <span className="step-desc">Audio Playback</span>
            </div>
          </div>

          <div className="provider-options-grid">
            <div className="provider-card">
              <h4>🇮🇳 Project Bhashini (Digital India)</h4>
              <p>National Language Translation Mission initiative supporting tribal and scheduled Indian languages including Santhali.</p>
              <span className="tag-free">Govt Open API</span>
            </div>
            <div className="provider-card">
              <h4>🧠 AI4Bharat (IIT Madras)</h4>
              <p>State-of-the-art open-source <strong>IndicTrans2</strong> transformer models specifically fine-tuned on Indic corpora.</p>
              <span className="tag-free">Open Source Model</span>
            </div>
          </div>

          <div className="code-snippet-box">
            <div className="code-header">
              <span>Integration Example (JavaScript / Node.js)</span>
              <button 
                type="button" 
                className="btn-copy-code"
                onClick={handleCopyCode}
              >
                {copiedSnippet ? '✓ Copied' : '📋 Copy Snippet'}
              </button>
            </div>
            <pre className="code-content">
              <code>{sampleApiCall}</code>
            </pre>
          </div>
        </div>

        <div className="modal-footer">
          <button 
            type="button" 
            className="btn-modal-done"
            onClick={onClose}
          >
            Got it, Return to Classroom App
          </button>
        </div>
      </div>
    </div>
  );
}
