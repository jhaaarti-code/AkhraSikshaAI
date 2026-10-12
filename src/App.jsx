import React, { useState } from 'react';
import Navbar from './components/Navbar';
import AboutProblem from './components/AboutProblem';
import TranslatorSection from './components/TranslatorSection';
import StudentActivityWrapper from './components/StudentActivityWrapper';
import ApiGuideModal from './components/ApiGuideModal';
import Footer from './components/Footer';
import './App.css';

export default function App() {
  const [showAbout, setShowAbout] = useState(false);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);

  return (
    <div className="app-root">
      {/* Top Navigation */}
      <Navbar 
        onOpenApiGuide={() => setIsApiModalOpen(true)}
        onToggleAbout={() => setShowAbout(!showAbout)}
        showAbout={showAbout}
      />

      <main className="main-content">
        {/* Hero Banner with Impact Context */}
        <section className="hero-banner" aria-label="Hero Overview">
          <div className="hero-container">
            <div className="hero-badge-row">
              <span className="hero-badge">🌟 NEP 2020 Mother-Tongue Learning Bridge</span>
              <span className="hero-badge sub-badge">Primary School Classroom Assistant</span>
            </div>

            <h2 className="hero-heading">
              Empowering Teachers. <span className="text-terracotta">Welcoming Children.</span>
            </h2>

            <p className="hero-description">
              Convert everyday Hindi classroom instructions into authentic Santhali (Ol Chiki ᱚᱞ ᱪᱤᱠᱤ) with instant phonetic pronunciation guides and speech audio. Built to eliminate fear and build trust for tribal children from Day 1.
            </p>

            <div className="hero-stats-row">
              <div className="stat-card">
                <span className="stat-num">7.6M+</span>
                <span className="stat-label">Santhali Speakers in India</span>
              </div>
              <div className="stat-card">
                <span className="stat-num">100%</span>
                <span className="stat-label">Zero-Hallucination Verified Primer</span>
              </div>
              <div className="stat-card">
                <span className="stat-num">3 Scripts</span>
                <span className="stat-label">Ol Chiki + Roman + Devanagari</span>
              </div>
              <div className="stat-card">
                <span className="stat-num">Audio TTS</span>
                <span className="stat-label">Browser Speech Synthesis</span>
              </div>
            </div>
          </div>
        </section>

        {/* Expandable About & Problem Section */}
        {showAbout && (
          <AboutProblem onClose={() => setShowAbout(false)} />
        )}

        {/* Core Teacher's Classroom Translator */}
        <section className="section-container" aria-label="Teacher Translation Tool">
          <div className="section-header-compact">
            <div className="section-badge-pill">कक्षा अनुवादक • Classroom Tool</div>
            <h2 className="section-title">Classroom Hindi-to-Tribal Translator</h2>
            <p className="section-subtitle">
              Select or type a classroom sentence to generate verified Ol Chiki script, phonetic guides, and audio.
            </p>
          </div>

          <TranslatorSection 
            onOpenApiGuide={() => setIsApiModalOpen(true)}
          />
        </section>

        {/* Student Educational Activity: Flashcards & Quiz */}
        <StudentActivityWrapper />
      </main>

      {/* Footer */}
      <Footer onOpenApiGuide={() => setIsApiModalOpen(true)} />

      {/* API Connection Guide Modal */}
      <ApiGuideModal 
        isOpen={isApiModalOpen} 
        onClose={() => setIsApiModalOpen(false)} 
      />
    </div>
  );
}
