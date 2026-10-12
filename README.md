# 🌱 AkhraSiksha AI — Bridging Language, Empowering Learning

> **VORTEX 2K26 Hackathon Prototype**  
> *A joyful, culturally rooted multilingual classroom assistant empowering primary teachers to bridge the language gap for tribal children.*

---

## 📌 Problem & Hackathon Mission

In tribal primary schools across Eastern India (Jharkhand, Odisha, West Bengal, Bihar, and Assam), teachers posted to rural schools predominantly communicate in standard Hindi. However, young Grade 1–3 children speak exclusively their mother tongue (such as **Santhali / ᱥᱟᱱᱛᱟᱲᱤ**) at home.

When young children hear instructions only in an unfamiliar state language, they experience anxiety, classroom silence, and hesitation. This language barrier is a leading cause of early dropouts in tribal belts.

**AkhraSiksha AI** translates essential Hindi classroom instructions into verified Santhali phrases with:
1. **Authentic Ol Chiki Script (ᱚᱞ ᱪᱤᱠᱤ)**
2. **Roman / Latin Phonetic Transliteration** (for teachers who don't know the script yet)
3. **Devanagari Phonetic Guide** (for Hindi-medium teachers)
4. **Browser Speech Synthesis (TTS Audio)** for pronunciation support
5. **Interactive Student Activity Corner** (Classroom Flashcards & Akhra Quiz Challenge)

### 🌿 What does "Akhra" mean?
In Santhal and Chotanagpur tribal tradition, the **Akhra (ᱟᱠᱷᱲᱟ)** is the sacred central open ground of the village where elders, youth, and children gather to sing, dance, dialogue, and share collective wisdom. *AkhraSiksha* brings this community spirit into primary classrooms.

---

## 🚀 Key Features

| Feature | Description |
| :--- | :--- |
| **Classroom Hindi Translator** | Input any classroom sentence or pick from one-click teacher prompt chips. |
| **Triple-Script Output** | Displays authentic Ol Chiki (ᱚᱞ ᱪᱤᱠᱤ), Latin phonetics, and Devanagari phonetics. |
| **Speech Audio (TTS)** | Native Web Speech synthesis with phonetic fallback when Santhali OS voices are not installed. |
| **Pedagogical Tips** | Cultural notes and classroom advice for teachers to build trust with students. |
| **Student Flashcards** | Bilingual flip cards with emojis and pronunciations for everyday objects and numbers. |
| **Akhra Star Quiz** | 5-question interactive quiz with stars, cheerful feedback, and explanations. |
| **Zero-Hallucination Integrity** | Uncurated custom text is honestly marked as Demo Mode rather than inventing fake translations. |
| **API Integration Blueprint** | Complete documentation and code sample to connect Bhashini or AI4Bharat IndicTrans2. |

---

## 💻 How to Run on macOS (Step-by-Step for Beginners)

Follow these simple steps in your Mac **Terminal** (`Terminal.app`):

### 1. Open Terminal and navigate to the project directory
```bash
cd /Users/aartijha/Documents/AkhraSikshaAI
```

### 2. Verify Node.js is installed
```bash
node -v
npm -v
```
*(Node.js v18 or newer is recommended; Node v24 is already installed on your Mac).*

### 3. Install project dependencies (if not already installed)
```bash
npm install
```

### 4. Start the local development server
```bash
npm run dev
```

### 5. Open your web browser
You will see output similar to:
```text
  VITE v6.4.4  ready in 180 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```
Click or copy-paste **`http://localhost:5173`** into Safari or Google Chrome.

### 6. To stop the application
Press `Ctrl + C` in the Terminal window when you want to stop the server.

---

## 🛡️ Linguistic Accuracy & Ethical AI Architecture

> [!IMPORTANT]
> **Hackathon Accuracy Policy:**  
> Small tribal languages must not be subjected to AI hallucination. Inventing unverified translations harms language revitalization and misleads teachers.

### How AkhraSiksha AI addresses this honestly:
1. **Curated Classroom Lexicon:** Everyday classroom phrases (greetings, sitting down, opening primers, washing hands, singing together) are verified against authentic Multilingual Education (MLE) materials and Pandit Raghunath Murmu's Ol Chiki conventions.
2. **Transparent Demo Mode:** If a teacher enters a custom phrase not present in the verified lexicon, the app **does not fabricate Santhali text**. Instead, it flags the output as `Demo Sandbox Mode`, displays clear placeholders, and suggests verified alternatives.
3. **Production API Blueprint:** Click the **"Connect API (Demo)"** button in the top navigation bar to see the exact code and architecture for connecting:
   - **Project Bhashini (Digital India / MeitY)** — National Language Translation Mission API.
   - **AI4Bharat (IIT Madras)** — `IndicTrans2` open-source sequence-to-sequence transformer model.

---

## 📂 Project Structure

```text
AkhraSikshaAI/
├── index.html                   # HTML template with Noto Sans Ol Chiki web fonts
├── package.json                 # Project dependencies (React 18, Vite)
├── vite.config.js               # Vite build configuration
├── README.md                    # Project documentation & execution guide
├── src/
│   ├── main.jsx                 # React root mounting
│   ├── index.css                # CSS variables, typography reset & theme tokens
│   ├── App.jsx                  # Main application container
│   ├── App.css                  # Responsive styling, animations & card layouts
│   ├── components/
│   │   ├── Navbar.jsx           # Top branding, hackathon badge & action buttons
│   │   ├── AboutProblem.jsx     # Challenge overview & NEP 2020 alignment
│   │   ├── TranslatorSection.jsx# Hindi input, prompt chips, Ol Chiki card, TTS
│   │   ├── StudentActivityWrapper.jsx # Tab container for Student Corner
│   │   ├── StudentFlashcards.jsx# Bilingual vocabulary flip cards with audio
│   │   ├── StudentQuiz.jsx      # 4-option primary quiz with star score tracking
│   │   ├── ApiGuideModal.jsx    # Bhashini & IndicTrans2 integration code modal
│   │   └── Footer.jsx           # Cultural attribution & hackathon credits
│   ├── data/
│   │   ├── languages.js         # Supported & roadmap tribal languages
│   │   ├── curatedPhrases.js    # Verified Santhali classroom phrase repository
│   │   └── quizData.js          # Flashcards & quiz questions dataset
│   └── services/
│       ├── speechService.js     # Web Speech API wrapper with phonetic fallback
│       └── translatorService.js # Verified primer matching & honest demo handlers
```

---

## 🎯 Alignment with NEP 2020 (National Education Policy)
Section 4.11 of NEP 2020 states:
> *"Wherever possible, the medium of instruction until at least Grade 5, but preferably till Grade 8 and beyond, will be the home language/mother tongue/local language/regional language."*

**AkhraSiksha AI** serves as the digital bridge enabling primary teachers to implement this policy directly in day-to-day classroom interactions.

---

## 🏆 Presentation Tips for VORTEX 2K26 Judges
1. **Show the Problem First:** Toggle the *"About Mission"* button in the navbar to show the real classroom dropout reality.
2. **Demonstrate 1-Click Teacher Prompts:** Click *"👋 नमस्ते बच्चों"* or *"🪑 बैठ जाएं"* to show instant triple-script translation.
3. **Demonstrate the Audio Button:** Click *"🔊 Speak"* to show how non-native teachers learn the correct pronunciation.
4. **Showcase Ethical AI Honesty:** Type a random non-classroom phrase to demonstrate how the system prevents hallucination and explains the Bhashini API integration.
5. **Engage with the Student Corner:** Click into the *"Akhra Quiz Challenge"* and answer questions to show how children are rewarded with stars.

---

*Made for VORTEX 2K26 Hackathon • Celebrating Indigenous Languages of India*
