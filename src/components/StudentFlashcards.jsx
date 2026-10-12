import React, { useState } from 'react';
import { FLASHCARD_DECK } from '../data/quizData';
import { speakText, stopSpeech } from '../services/speechService';

export default function StudentFlashcards() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const card = FLASHCARD_DECK[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % FLASHCARD_DECK.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + FLASHCARD_DECK.length) % FLASHCARD_DECK.length);
  };

  const handleSpeakWord = (e) => {
    e.stopPropagation();
    stopSpeech();
    speakText({
      text: card.santhaliRoman,
      langCode: 'sat',
      romanPhonetic: card.santhaliRoman,
      devanagariPhonetic: card.santhaliDevanagari,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false)
    });
  };

  return (
    <div className="flashcards-wrapper">
      <div className="flashcards-toolbar">
        <div className="deck-counter">
          Card <strong>{currentIndex + 1}</strong> of <strong>{FLASHCARD_DECK.length}</strong>
        </div>
        <div className="deck-category-badge">
          🏷️ {card.category}
        </div>
      </div>

      <div 
        className={`flashcard-item ${isFlipped ? 'flipped' : ''}`}
        onClick={() => setIsFlipped(!isFlipped)}
        title="Click card to flip between Hindi and Santhali"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            setIsFlipped(!isFlipped);
          }
        }}
      >
        <div className="card-face card-front">
          <div className="card-emoji">{card.emoji}</div>
          <div className="card-label-sub">Hindi Word (हिंदी शब्द):</div>
          <h3 className="card-word-hi">{card.hindi}</h3>
          <div className="tap-flip-hint">
            <span>🔄 Tap or click to reveal Santhali (संथाली देखें)</span>
          </div>
        </div>

        <div className="card-face card-back">
          <div className="card-emoji-small">{card.emoji}</div>
          <div className="card-olchiki-prominent">{card.santhaliOlChiki}</div>
          <div className="card-roman-phonetic">{card.santhaliRoman}</div>
          <div className="card-devanagari-phonetic">{card.santhaliDevanagari}</div>

          <div className="card-usage-row">
            <span className="usage-label">Classroom Use:</span>
            <span className="usage-text">{card.exampleUsage}</span>
          </div>

          <div className="card-audio-action">
            <button
              type="button"
              className="btn-card-speak"
              onClick={handleSpeakWord}
              aria-label="Listen to card pronunciation"
            >
              <span>{isSpeaking ? '⏹ Speaking...' : '🔊 Listen Word'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flashcards-controls">
        <button 
          type="button" 
          className="btn-control-arrow" 
          onClick={handlePrev}
          aria-label="Previous Flashcard"
        >
          ◀ Previous
        </button>

        <button 
          type="button" 
          className="btn-flip-action" 
          onClick={() => setIsFlipped(!isFlipped)}
        >
          {isFlipped ? '🔄 Show Hindi' : '🔄 Flip to Santhali'}
        </button>

        <button 
          type="button" 
          className="btn-control-arrow" 
          onClick={handleNext}
          aria-label="Next Flashcard"
        >
          Next ▶
        </button>
      </div>
    </div>
  );
}
