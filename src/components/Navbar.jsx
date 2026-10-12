import React from 'react';

export default function Navbar({ onOpenApiGuide, onToggleAbout, showAbout }) {
  return (
    <header className="site-header">
      <div className="header-container">
        <div className="brand-group">
          <div className="brand-logo-badge">
            <span className="logo-symbol">🌱</span>
          </div>
          <div className="brand-text">
            <div className="brand-title-row">
              <h1 className="brand-name">AkhraSiksha AI</h1>
              <span className="hackathon-tag">VORTEX 2K26</span>
            </div>
            <p className="brand-tagline">
              Bridging Language, Empowering Learning • <span className="tagline-hindi">अखड़ा शिक्षा एआई</span>
            </p>
          </div>
        </div>

        <nav className="header-actions">
          <button 
            type="button" 
            className={`btn-ghost ${showAbout ? 'active' : ''}`}
            onClick={onToggleAbout}
            aria-label="Toggle Mission and Problem Details"
          >
            <span className="btn-icon">💡</span>
            <span>{showAbout ? 'Hide Mission' : 'About Mission'}</span>
          </button>

          <button 
            type="button" 
            className="btn-outline-api"
            onClick={onOpenApiGuide}
            aria-label="View API Integration Guide"
          >
            <span className="btn-icon">⚡</span>
            <span>Connect API (Demo)</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
