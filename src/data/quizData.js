/**
 * Student Educational Activities Dataset
 * Specially designed for primary school students (Grade 1-3)
 * Helps young learners match Hindi & Santhali classroom words with pictures & audio cues.
 */

export const FLASHCARD_DECK = [
  {
    id: 'fc-1',
    category: 'Classroom Basics',
    emoji: '📖',
    hindi: 'किताब (Book)',
    santhaliOlChiki: 'ᱯᱩᱛᱷᱤ',
    santhaliRoman: 'Puthi',
    santhaliDevanagari: 'पुथी',
    exampleUsage: 'ᱯᱩᱛᱷᱤ ᱡᱷᱤᱡᱽ ᱢᱮ (Open your book)'
  },
  {
    id: 'fc-2',
    category: 'Hygiene & Nature',
    emoji: '💧',
    hindi: 'पानी (Water)',
    santhaliOlChiki: 'ᱫᱟᱜ',
    santhaliRoman: 'Dah',
    santhaliDevanagari: 'दाग / दाह',
    exampleUsage: 'ᱫᱟᱜ ᱧᱩᱭ ᱢᱮ (Drink water)'
  },
  {
    id: 'fc-3',
    category: 'Greetings',
    emoji: '🙏',
    hindi: 'नमस्ते / प्रणाम (Greetings)',
    santhaliOlChiki: 'ᱡᱚᱦᱟᱨ',
    santhaliRoman: 'Johar',
    santhaliDevanagari: 'जोहार',
    exampleUsage: 'ᱡᱚᱦᱟᱨ ᱢᱟᱪᱮᱛ! (Greetings Teacher!)'
  },
  {
    id: 'fc-4',
    category: 'Classroom Objects',
    emoji: '✏️',
    hindi: 'कलम / पेंसिल (Pen/Pencil)',
    santhaliOlChiki: 'ᱠᱚᱞᱚᱢ',
    santhaliRoman: 'Kalom',
    santhaliDevanagari: 'कोलोम',
    exampleUsage: 'ᱠᱚᱞᱚᱢ ᱥᱟᱵᱽ ᱢᱮ (Hold the pen)'
  },
  {
    id: 'fc-5',
    category: 'Counting (Numbers)',
    emoji: '1️⃣',
    hindi: 'एक (One)',
    santhaliOlChiki: 'ᱢᱤᱫ',
    santhaliRoman: 'Mit’ / Mid',
    santhaliDevanagari: 'मिद',
    exampleUsage: 'ᱢᱤᱫ ᱴᱟᱝ (One item)'
  },
  {
    id: 'fc-6',
    category: 'Counting (Numbers)',
    emoji: '2️⃣',
    hindi: 'दो (Two)',
    santhaliOlChiki: 'ᱵᱟᱨ',
    santhaliRoman: 'Bar',
    santhaliDevanagari: 'बार',
    exampleUsage: 'ᱵᱟᱨ ᱦᱚᱲ (Two people)'
  },
  {
    id: 'fc-7',
    category: 'Counting (Numbers)',
    emoji: '3️⃣',
    hindi: 'तीन (Three)',
    santhaliOlChiki: 'ᱯᱮ',
    santhaliRoman: 'Pe',
    santhaliDevanagari: 'पे',
    exampleUsage: 'ᱯᱮ ᱜᱚᱴᱟᱝ (Three objects)'
  },
  {
    id: 'fc-8',
    category: 'Nature & Surroundings',
    emoji: '🌳',
    hindi: 'पेड़ (Tree)',
    santhaliOlChiki: 'ᱫᱟᱨᱮ',
    santhaliRoman: 'Dare',
    santhaliDevanagari: 'दारे',
    exampleUsage: 'ᱫᱟᱨᱮ ᱨᱮ ᱵᱤᱞᱤ (Fruit on the tree)'
  },
  {
    id: 'fc-9',
    category: 'Classroom Action',
    emoji: '🪑',
    hindi: 'बैठना (Sit)',
    santhaliOlChiki: 'ᱫᱩᱲᱩᱵ',
    santhaliRoman: 'Duṛub',
    santhaliDevanagari: 'दुड़ुब',
    exampleUsage: 'ᱫᱩᱲᱩᱵ ᱢᱮ (Sit down)'
  },
  {
    id: 'fc-10',
    category: 'Classroom Action',
    emoji: '🎵',
    hindi: 'गीत / कविता (Song/Rhyme)',
    santhaliOlChiki: 'ᱥᱮᱨᱮᱧ',
    santhaliRoman: 'Seren’',
    santhaliDevanagari: 'सेरेंग',
    exampleUsage: 'ᱥᱮᱨᱮᱧ ᱟᱸᱡᱚᱢ ᱢᱮ (Listen to song)'
  }
];

export const QUIZ_QUESTIONS = [
  {
    id: 'q-1',
    question: 'जब सुबह शिक्षक या मित्र से मिलते हैं, तो संथाली में अभिवादन के लिए क्या कहते हैं?',
    questionEn: 'What is the respectful Santhali greeting when meeting someone in the morning?',
    options: [
      { text: 'जोहार (Johar / ᱡᱚᱦᱟᱨ)', isCorrect: true },
      { text: 'दुड़ुब (Duṛub / ᱫᱩᱲᱩᱵ)', isCorrect: false },
      { text: 'पुथी (Puthi / ᱯᱩᱛᱷᱤ)', isCorrect: false },
      { text: 'दाका (Daka / ᱫᱟᱠᱟ)', isCorrect: false }
    ],
    explanation: 'सही जवाब! "जोहार" (Johar) संथाली संस्कृति का आदरणीय और पारंपरिक अभिवादन शब्द है।'
  },
  {
    id: 'q-2',
    question: 'अगर शिक्षक बच्चे से कहें "बैठ जाओ", तो संथाली में इसे क्या कहेंगे?',
    questionEn: 'How does a teacher say "Sit down" in Santhali?',
    options: [
      { text: 'सेरेंग में (Seren me)', isCorrect: false },
      { text: 'दुरुब में (Duṛub me / ᱫᱩᱲᱩᱵ ᱢᱮ)', isCorrect: true },
      { text: 'दाग ञुय में (Dah ñuy me)', isCorrect: false },
      { text: 'कयोम पे (Kayom pe)', isCorrect: false }
    ],
    explanation: 'शाबाश! "दुरुब में" (Duṛub me) का अर्थ है "बैठ जाओ"।'
  },
  {
    id: 'q-3',
    question: 'विद्यालय में पढ़ाई की "किताब" (Book) को संथाली भाषा में क्या कहा जाता है?',
    questionEn: 'What is a "Book / Primer" called in Santhali?',
    options: [
      { text: 'दारे (Dare)', isCorrect: false },
      { text: 'पुथी (Puthi / ᱯᱩᱛᱷᱤ)', isCorrect: true },
      { text: 'कोलंग (Kolom)', isCorrect: false },
      { text: 'थार (Thar)', isCorrect: false }
    ],
    explanation: 'बहुत अच्छे! "पुथी" (Puthi) का मतलब पुस्तक या किताब होता है।'
  },
  {
    id: 'q-4',
    question: 'संथाली गिनती में "मिद" (Mit’ / ᱢᱤᱫ) का हिंदी अर्थ क्या है?',
    questionEn: 'What number does "Mit’ / Mid" represent in Santhali?',
    options: [
      { text: 'एक (1)', isCorrect: true },
      { text: 'दो (2)', isCorrect: false },
      { text: 'तीन (3)', isCorrect: false },
      { text: 'पांच (5)', isCorrect: false }
    ],
    explanation: 'शानदार! "मिद" (Mit’ / Mid) का मतलब 1 (एक) होता है।'
  },
  {
    id: 'q-5',
    question: 'मध्याह्न भोजन (Mid-Day Meal) से पहले हाथ धोने के बाद "पानी" को संथाली में क्या कहते हैं?',
    questionEn: 'What is the Santhali word for "Water"?',
    options: [
      { text: 'सेरेंग (Seren)', isCorrect: false },
      { text: 'दाग / दाह (Dah / ᱫᱟᱜ)', isCorrect: true },
      { text: 'बार (Bar)', isCorrect: false },
      { text: 'सोज्हे (Sojhe)', isCorrect: false }
    ],
    explanation: 'बिल्कुल सही! संथाली में पानी को "दाग" या "दाह" (Dah / ᱫᱟᱜ) कहा जाता है।'
  }
];
