import React, { useState } from 'react';
import StudentFlashcards from './StudentFlashcards';
import StudentQuiz from './StudentQuiz';

export default function StudentActivityWrapper() {
  const [activeTab, setActiveTab] = useState('flashcards');

  return (
    <section className="student-activity-section" aria-label="Student Learning Activities">
      <div className="activity-container">
        <div className="activity-header">
          <div className="activity-title-group">
            <span className="section-badge">बाल गतिविधि केंद्र</span>
            <h2>Interactive Student Corner: Joyful Mother-Tongue Learning</h2>
            <p className="section-subtext">
              Engage young primary-grade tribal students with bilingual vocabulary cards and celebratory quizzes.
            </p>
          </div>

          <div className="tab-pill-switcher" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'flashcards'}
              className={`tab-btn ${activeTab === 'flashcards' ? 'active-tab' : ''}`}
              onClick={() => setActiveTab('flashcards')}
            >
              <span className="tab-icon">🎴</span>
              <span>Classroom Flashcards</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'quiz'}
              className={`tab-btn ${activeTab === 'quiz' ? 'active-tab' : ''}`}
              onClick={() => setActiveTab('quiz')}
            >
              <span className="tab-icon">⭐</span>
              <span>Akhra Quiz Challenge</span>
            </button>
          </div>
        </div>

        <div className="activity-body-card">
          {activeTab === 'flashcards' ? (
            <StudentFlashcards />
          ) : (
            <StudentQuiz />
          )}
        </div>
      </div>
    </section>
  );
}
