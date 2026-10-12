import React, { useState } from 'react';
import { QUIZ_QUESTIONS } from '../data/quizData';
import { speakText, stopSpeech } from '../services/speechService';

export default function StudentQuiz() {
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const question = QUIZ_QUESTIONS[currentQIndex];

  const handleSelectOption = (index) => {
    if (isAnswerSubmitted) return;
    setSelectedOptionIndex(index);
    setIsAnswerSubmitted(true);

    const isCorrect = question.options[index].isCorrect;
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    setSelectedOptionIndex(null);
    setIsAnswerSubmitted(false);

    if (currentQIndex + 1 < QUIZ_QUESTIONS.length) {
      setCurrentQIndex((prev) => prev + 1);
    } else {
      setQuizFinished(true);
    }
  };

  const handleRestartQuiz = () => {
    setCurrentQIndex(0);
    setSelectedOptionIndex(null);
    setIsAnswerSubmitted(false);
    setScore(0);
    setQuizFinished(false);
    stopSpeech();
  };

  const handlePronounceAnswer = (optText) => {
    stopSpeech();
    speakText({
      text: optText,
      langCode: 'sat',
      romanPhonetic: optText,
      devanagariPhonetic: optText
    });
  };

  if (quizFinished) {
    const percentage = Math.round((score / QUIZ_QUESTIONS.length) * 100);
    return (
      <div className="quiz-result-card animate-fade-in">
        <div className="result-trophy">🏆</div>
        <h3>प्रश्नोत्तरी पूर्ण! (Quiz Completed!)</h3>
        <p className="result-cheer">
          {percentage >= 80 
            ? '🌟 शानदार! (Aḍi bhagi kạmi - Very good work!)' 
            : '👍 अच्छा प्रयास! (Good try, keep learning!)'}
        </p>

        <div className="score-badge-circle">
          <span className="score-num">{score}</span>
          <span className="score-total">/ {QUIZ_QUESTIONS.length}</span>
        </div>

        <div className="stars-earned-row">
          {Array.from({ length: QUIZ_QUESTIONS.length }).map((_, i) => (
            <span key={i} className={`star-item ${i < score ? 'star-filled' : 'star-empty'}`}>
              ★
            </span>
          ))}
        </div>

        <p className="score-summary-text">
          आपने {QUIZ_QUESTIONS.length} में से {score} संथाली प्राथमिक शब्दों के सही उत्तर दिए हैं।
        </p>

        <div className="result-actions">
          <button 
            type="button" 
            className="btn-restart-quiz"
            onClick={handleRestartQuiz}
          >
            🔄 फिर से खेलें (Play Again)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-container">
      {/* Quiz Progress & Score Header */}
      <div className="quiz-meta-header">
        <div className="q-counter">
          प्रश्न <strong>{currentQIndex + 1}</strong> of <strong>{QUIZ_QUESTIONS.length}</strong>
        </div>
        <div className="score-tracker">
          ⭐ Stars: <strong>{score}</strong>
        </div>
      </div>

      <div className="quiz-progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${((currentQIndex + 1) / QUIZ_QUESTIONS.length) * 100}%` }}
        ></div>
      </div>

      {/* Question Card */}
      <div className="question-card">
        <h4 className="question-hi">{question.question}</h4>
        <p className="question-en">({question.questionEn})</p>
      </div>

      {/* Options List */}
      <div className="options-grid" role="group" aria-label="Quiz Answer Options">
        {question.options.map((opt, idx) => {
          let btnClass = 'option-btn';
          if (isAnswerSubmitted) {
            if (opt.isCorrect) {
              btnClass += ' correct-option';
            } else if (idx === selectedOptionIndex) {
              btnClass += ' incorrect-option';
            } else {
              btnClass += ' muted-option';
            }
          }

          return (
            <button
              key={idx}
              type="button"
              className={btnClass}
              onClick={() => handleSelectOption(idx)}
              disabled={isAnswerSubmitted}
            >
              <span className="option-marker">
                {String.fromCharCode(65 + idx)}
              </span>
              <span className="option-text">{opt.text}</span>

              {isAnswerSubmitted && opt.isCorrect && (
                <span className="feedback-check">✓</span>
              )}
              {isAnswerSubmitted && idx === selectedOptionIndex && !opt.isCorrect && (
                <span className="feedback-cross">✕</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Explanation Banner */}
      {isAnswerSubmitted && (
        <div className={`explanation-box ${question.options[selectedOptionIndex]?.isCorrect ? 'exp-correct' : 'exp-incorrect'} animate-fade-in`}>
          <div className="exp-icon">
            {question.options[selectedOptionIndex]?.isCorrect ? '🎉' : '💡'}
          </div>
          <div className="exp-content">
            <p className="exp-text">{question.explanation}</p>
          </div>
          <button
            type="button"
            className="btn-next-q"
            onClick={handleNextQuestion}
          >
            {currentQIndex + 1 === QUIZ_QUESTIONS.length ? 'नतीजे देखें (View Results) ➔' : 'अगला प्रश्न (Next) ➔'}
          </button>
        </div>
      )}
    </div>
  );
}
