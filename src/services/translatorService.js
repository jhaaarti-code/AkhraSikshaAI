import { CURATED_CLASSROOM_PHRASES, CURATED_STUDENT_SANTHALI_PHRASES } from '../data/curatedPhrases';

/**
 * Translator Service for AkhraSiksha AI
 * Supports bidirectional classroom translation:
 * 1. Teacher Hindi ➔ Santhali (Ol Chiki, Roman, Devanagari)
 * 2. Student Santhali ➔ Hindi
 * 
 * Strict Accuracy Architecture:
 * - Checks verified classroom lexicon (Multilingual Education / MLE primers).
 * - If verified match exists: Returns authenticated Ol Chiki, Roman, Devanagari and pedagogy guidance.
 * - If unverified custom text: Transparently flags as 'DEMO_UNVERIFIED_INPUT', does NOT invent
 *   hallucinated words, and provides clear pedagogical notice.
 */

export const translateHindiToTribal = async ({
  text,
  targetLanguageCode = 'sat'
}) => {
  const trimmed = (text || '').trim();
  if (!trimmed) {
    throw new Error('कृपया अनुवाद के लिए कोई हिंदी वाक्य दर्ज करें (Please enter a Hindi classroom sentence).');
  }

  // Brief latency simulation for realistic interface interaction
  await new Promise((resolve) => setTimeout(resolve, 300));

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

  const normalizedInput = trimmed.toLowerCase();

  // 1. Try exact or normalized match
  let matchedPhrase = CURATED_CLASSROOM_PHRASES.find(phrase => {
    return (
      phrase.hindi.toLowerCase() === normalizedInput ||
      phrase.shortHindi.toLowerCase() === normalizedInput
    );
  });

  // 2. Try keyword intent match
  if (!matchedPhrase) {
    matchedPhrase = CURATED_CLASSROOM_PHRASES.find(phrase => {
      return phrase.keywords.some(kw => normalizedInput.includes(kw.toLowerCase()));
    });
  }

  // 3. Return verified match
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

  // 4. Honest unverified handling
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

/**
 * Translate Student Santhali Speech / Text to Hindi
 */
export const translateSanthaliToHindi = async ({
  text
}) => {
  const trimmed = (text || '').trim();
  if (!trimmed) {
    throw new Error('कृपया अनुवाद के लिए संथाली वाक्य दर्ज करें या बोलें (Please enter or speak a Santhali sentence).');
  }

  await new Promise((resolve) => setTimeout(resolve, 300));

  const normalizedInput = trimmed.toLowerCase();

  // 1. Search in student expressions
  let matchedStudent = CURATED_STUDENT_SANTHALI_PHRASES.find(phrase => {
    return (
      phrase.santhaliRoman.toLowerCase() === normalizedInput ||
      phrase.santhaliOlChiki === trimmed ||
      phrase.santhaliDevanagari === trimmed ||
      phrase.keywords.some(kw => normalizedInput.includes(kw.toLowerCase()))
    );
  });

  if (matchedStudent) {
    return {
      status: 'VERIFIED_STUDENT_MATCH',
      isVerified: true,
      isDemoSimulation: false,
      santhaliInput: trimmed,
      santhaliOlChiki: matchedStudent.santhaliOlChiki,
      santhaliRoman: matchedStudent.santhaliRoman,
      santhaliDevanagari: matchedStudent.santhaliDevanagari,
      hindiTranslation: matchedStudent.hindi,
      englishMeaning: matchedStudent.english,
      teacherAdvice: matchedStudent.teacherAdvice,
      category: matchedStudent.category,
      verificationBadge: 'Verified Student Expression'
    };
  }

  // 2. Also search in general classroom phrases
  let matchedGeneral = CURATED_CLASSROOM_PHRASES.find(phrase => {
    return (
      phrase.santhaliRoman.toLowerCase() === normalizedInput ||
      phrase.santhaliOlChiki === trimmed ||
      phrase.santhaliDevanagari === trimmed ||
      phrase.keywords.some(kw => normalizedInput.includes(kw.toLowerCase()))
    );
  });

  if (matchedGeneral) {
    return {
      status: 'VERIFIED_PRIMER_MATCH',
      isVerified: true,
      isDemoSimulation: false,
      santhaliInput: trimmed,
      santhaliOlChiki: matchedGeneral.santhaliOlChiki,
      santhaliRoman: matchedGeneral.santhaliRoman,
      santhaliDevanagari: matchedGeneral.santhaliDevanagari,
      hindiTranslation: matchedGeneral.hindi,
      englishMeaning: matchedGeneral.english,
      teacherAdvice: matchedGeneral.teacherTip,
      category: matchedGeneral.category,
      verificationBadge: 'Verified Classroom Primer'
    };
  }

  // 3. Honest unverified fallback
  return {
    status: 'UNVERIFIED_CUSTOM_DEMO',
    isVerified: false,
    isDemoSimulation: true,
    santhaliInput: trimmed,
    santhaliOlChiki: trimmed,
    santhaliRoman: trimmed,
    hindiTranslation: '⚠️ [लाइव AI अनुवाद इंजन आवश्यक है - Live API Required]',
    englishMeaning: `[Student spoken input: "${trimmed}"]`,
    teacherAdvice: 'यह वाक्य सत्यापित प्राथमिक प्राइमर सूची में नहीं मिला। मनगढ़ंत अनुवाद से बचने के लिए, कृपया ऊपर दिए गए त्वरित छात्र वाक्यों में से चुनें या AI4Bharat / Bhashini API जोड़ें।',
    demoNotice: 'Notice: This Santhali phrase is not in the verified student primer. To translate arbitrary uncurated phrases, connect an Indic translation engine (AI4Bharat IndicTrans2 or Bhashini).',
    suggestedPhrases: CURATED_STUDENT_SANTHALI_PHRASES.slice(0, 3)
  };
};
