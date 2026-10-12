import { CURATED_CLASSROOM_PHRASES } from '../data/curatedPhrases';

/**
 * Translator Service for AkhraSiksha AI
 * 
 * Strict Accuracy Architecture:
 * 1. Checks verified classroom lexicon (Multilingual Education / MLE primers).
 * 2. If verified match exists: Returns authenticated Ol Chiki, Roman transliteration, and pedagogy tips.
 * 3. If unverified custom text: Transparently flags as 'DEMO_UNVERIFIED_INPUT', does NOT invent
 *    hallucinated Santhali words, provides clear pedagogical notice, and guides user to API setup.
 */

export const translateHindiToTribal = async ({
  text,
  targetLanguageCode = 'sat',
  apiEndpoint = null,
  apiKey = null
}) => {
  // 1. Validation: check empty input
  const trimmed = (text || '').trim();
  if (!trimmed) {
    throw new Error('कृपया अनुवाद के लिए कोई हिंदी वाक्य दर्ज करें (Please enter a Hindi classroom sentence).');
  }

  // Simulate network latency for realistic hackathon demo interaction
  await new Promise((resolve) => setTimeout(resolve, 450));

  // Check language roadmap status
  if (targetLanguageCode !== 'sat') {
    return {
      status: 'ROADMAP_PREVIEW',
      isVerified: false,
      isDemoSimulation: true,
      sourceLanguage: 'Hindi (हिंदी)',
      targetLanguage: targetLanguageCode,
      message: 'इस जनजातीय भाषा के प्राइमर पर कार्य प्रगति पर है (Language support is currently under active roadmap development). संथाली (Santhali) का चयन करें।'
    };
  }

  // 2. Check exact or keyword match against verified classroom primer
  const normalizedInput = trimmed.toLowerCase();

  // Try exact match or normalized match
  let matchedPhrase = CURATED_CLASSROOM_PHRASES.find(phrase => {
    return (
      phrase.hindi.toLowerCase() === normalizedInput ||
      phrase.shortHindi.toLowerCase() === normalizedInput
    );
  });

  // Try keyword intent match if exact match wasn't found
  if (!matchedPhrase) {
    matchedPhrase = CURATED_CLASSROOM_PHRASES.find(phrase => {
      return phrase.keywords.some(kw => normalizedInput.includes(kw.toLowerCase()));
    });
  }

  // 3. If verified phrase found in authentic primer
  if (matchedPhrase) {
    return {
      status: 'VERIFIED_PRIMER_MATCH',
      isVerified: true,
      isDemoSimulation: false,
      phraseId: matchedPhrase.id,
      category: matchedPhrase.category,
      hindiInput: trimmed,
      matchedStandardHindi: matchedPhrase.hindi,
      english: matchedPhrase.english,
      santhaliOlChiki: matchedPhrase.santhaliOlChiki,
      santhaliRoman: matchedPhrase.santhaliRoman,
      santhaliDevanagari: matchedPhrase.santhaliDevanagari,
      teacherTip: matchedPhrase.teacherTip,
      difficulty: matchedPhrase.difficulty,
      sourceAttribution: 'Authentic Santhali MLE Primary Educational Primer (Ol Chiki)',
      verificationBadge: 'Verified Classroom Primer'
    };
  }

  // 4. Honest Unverified / Custom Input Handling
  // Adhering strictly to accuracy guidelines: DO NOT invent Santhali translations.
  return {
    status: 'UNVERIFIED_CUSTOM_DEMO',
    isVerified: false,
    isDemoSimulation: true,
    hindiInput: trimmed,
    english: `[Classroom intent: "${trimmed}"]`,
    santhaliOlChiki: '⚠️ [ ᱞᱟᱭᱤᱵᱷ API ᱡᱚᱲᱟᱣ ᱞᱟᱹᱠᱛᱤᱭᱟᱱ ]',
    santhaliRoman: '[Live IndicTrans2 / Bhashini API Endpoint Required]',
    santhaliDevanagari: '[सत्यापन सूचना: लाइव अनुवाद API से कनेक्ट करें]',
    teacherTip: 'यह एक कस्टम वाक्य है जो प्राथमिक पाठ्यचर्या प्राइमर में शामिल नहीं है। भाषाई प्रामाणिकता बनाए रखने के लिए, मॉडल मनगढ़ंत संथाली शब्द नहीं बनाता। कक्षा में नीचे दिए गए प्रमाणित वाक्यांशों का उपयोग करें या AI4Bharat / Bhashini API जोड़ें।',
    demoNotice: 'Notice: This specific sentence is not in the verified classroom primer. To translate arbitrary uncurated sentences without linguistic hallucination, connect an AI translation engine (AI4Bharat IndicTrans2 or Bhashini).',
    suggestedPhrases: CURATED_CLASSROOM_PHRASES.slice(0, 3)
  };
};
