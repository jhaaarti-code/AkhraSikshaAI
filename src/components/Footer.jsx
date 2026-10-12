import React from 'react';

export default function Footer({ onOpenApiGuide }) {
  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div className="footer-top-row">
          <div className="footer-brand">
            <div className="footer-logo">
              <span className="logo-emoji">🌱</span>
              <span className="brand-title">AkhraSiksha AI</span>
            </div>
            <p className="footer-tagline">
              Bridging Language, Empowering Learning — Primary Mother-Tongue Classroom Assistant.
            </p>
          </div>

          <div className="footer-links-group">
            <div className="footer-col">
              <h5>Mission & Compliance</h5>
              <ul>
                <li><span>NEP 2020 Foundational Literacy</span></li>
                <li><span>Mother-Tongue First Principle</span></li>
                <li><span>Tribal Welfare Department MLE</span></li>
              </ul>
            </div>

            <div className="footer-col">
              <h5>Languages</h5>
              <ul>
                <li><span className="active-link">Santhali (Ol Chiki - ᱥᱟᱱᱛᱟᱲᱤ)</span></li>
                <li><span className="muted-link">Ho (Roadmap Phase 2)</span></li>
                <li><span className="muted-link">Mundari (Roadmap Phase 2)</span></li>
                <li><span className="muted-link">Kurukh (Roadmap Phase 3)</span></li>
              </ul>
            </div>

            <div className="footer-col">
              <h5>Developer Tools</h5>
              <ul>
                <li>
                  <button type="button" className="footer-btn-link" onClick={onOpenApiGuide}>
                    API Architecture Guide
                  </button>
                </li>
                <li><span>IndicTrans2 & Bhashini Specs</span></li>
                <li><span>Web Speech Synthesis API</span></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <div className="credit-text">
            <span>Built with ❤️ for <strong>VORTEX 2K26</strong></span>
            <span className="divider">•</span>
            <span>Honoring <strong>Guru Gomke Pandit Raghunath Murmu</strong> (Creator of Ol Chiki script, 1925)</span>
          </div>
          <div className="hackathon-tag-pill">
            Prototype Demo — Ethical Indic AI
          </div>
        </div>
      </div>
    </footer>
  );
}
