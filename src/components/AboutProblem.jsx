import React from 'react';

export default function AboutProblem({ onClose }) {
  return (
    <section className="about-section animate-fade-in" aria-label="About the AkhraSiksha AI Project">
      <div className="about-card">
        <div className="about-header">
          <div className="about-title-wrap">
            <span className="badge-pill">NEP 2020 Multilingual Education</span>
            <h2>The Challenge: Bridging the Primary Classroom Language Gap</h2>
          </div>
          {onClose && (
            <button 
              type="button" 
              className="btn-close" 
              onClick={onClose}
              aria-label="Close About section"
            >
              ✕
            </button>
          )}
        </div>

        <div className="about-grid">
          <div className="about-col">
            <div className="col-icon">🛑</div>
            <h3>The Ground Reality</h3>
            <p>
              In tribal belt primary schools (across Jharkhand, Odisha, West Bengal, and Bihar), many newly posted teachers communicate primarily in Hindi. However, young Grade 1–3 children speak exclusively their mother tongue (such as <strong>Santhali / ᱥᱟᱱᱛᱟᱲᱤ</strong>) at home.
            </p>
            <p className="highlight-text">
              This language barrier creates classroom hesitation, silence, and early dropout rates among tribal first-generation learners.
            </p>
          </div>

          <div className="about-col">
            <div className="col-icon">🌿</div>
            <h3>What is "Akhra"?</h3>
            <p>
              In Santhal and Chotanagpur indigenous culture, the <strong>Akhra (ᱟᱠᱷᱲᱟ)</strong> is the vibrant sacred village square where songs, dance, storytelling, and democratic learning take place naturally under open skies.
            </p>
            <p>
              <strong>AkhraSiksha AI</strong> brings this spirit into modern classrooms—equipping teachers with immediate, respectful mother-tongue phrases.
            </p>
          </div>

          <div className="about-col">
            <div className="col-icon">🎯</div>
            <h3>Our Solution in Action</h3>
            <ul className="solution-bullets">
              <li>
                <strong>Instant Classroom Conversions:</strong> Turn simple instructions (sit down, open book, praise) into verified Santhali phrases.
              </li>
              <li>
                <strong>Triple Script Support:</strong> Ol Chiki (ᱚᱞ ᱪᱤᱠᱤ) + Roman Transliteration + Devanagari guide for instant teacher pronunciation.
              </li>
              <li>
                <strong>Audio Pronunciation:</strong> Real-time browser audio playback to assist non-native educators.
              </li>
              <li>
                <strong>Student Bal Activity:</strong> Interactive flashcards and quizzes for joyful classroom engagement.
              </li>
            </ul>
          </div>
        </div>

        <div className="about-footer-strip">
          <span className="ethics-pill">🛡️ Linguistic Integrity Guarantee</span>
          <p>
            We adhere strictly to ethical AI guidelines: verified pedagogical primers are showcased as authentic, while arbitrary text is never hallucinated. Full API hooks for government engines (Bhashini / AI4Bharat) are provided.
          </p>
        </div>
      </div>
    </section>
  );
}
