import { CURATED_CLASSROOM_PHRASES, CURATED_STUDENT_SANTHALI_PHRASES } from '../data/curatedPhrases.js';

/**
 * Normalizes text for reliable semantic comparison:
 * - Trims whitespace
 * - Converts Latin to lowercase
 * - Strips Hindi & English punctuation marks (।, ., ,, !, ?, :, -, ", ', etc.)
 * - Normalizes internal multiple spaces
 */
export const normalizeText = (str = '') => {
  return (str || '')
    .toLowerCase()
    .replace(/[।.,!?।\-_:;"'()[\]{}~`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Translator Service for AkhraSiksha AI
 * 
 * Strict Accuracy Safeguard:
 * 1. ONLY matches if the input is genuinely identical or a normalized variant of a verified phrase.
 * 2. Loose single-keyword or substring matches are strictly forbidden to eliminate false positive bugs.
 * 3. If an input is not in the curated primer, it returns NOT_IN_CURATED_PRIMER with isVerified: false,
 *    and NEVER displays an unrelated predefined translation (e.g., 'Wash your hands' for unrelated sentences).
 */

export const translateHindiToTribal = async ({
  text,
  targetLanguageCode = 'sat'
}) => {
  const trimmed = (text || '').trim();
  if (!trimmed) {
    throw new Error('कृपया अनुवाद के लिए कोई हिंदी वाक्य दर्ज करें (Please enter a Hindi classroom sentence).');
  }

  // Latency simulation for realistic interface interaction
  await new Promise((resolve) => setTimeout(resolve, 250));

  if (targetLanguageCode !== 'sat') {
    return {
      status: 'ROADMAP_PREVIEW',
      isVerified: false,
      sourceLanguage: 'Hindi (हिंदी)',
      targetLanguage: targetLanguageCode,
      message: 'इस जनजातीय भाषा के प्राइमर पर कार्य प्रगति पर है। कृपया संथाली (Santhali) का चयन करें।'
    };
  }

  const normalizedInput = normalizeText(trimmed);

  // Exact or strict variant match against verified classroom primer
  const matchedPhrase = CURATED_CLASSROOM_PHRASES.find(phrase => {
    const normMain = normalizeText(phrase.hindi);
    const normShort = normalizeText(phrase.shortHindi);

    if (normalizedInput === normMain || normalizedInput === normShort) {
      return true;
    }

    if (phrase.validVariants && phrase.validVariants.length > 0) {
      return phrase.validVariants.some(v => normalizeText(v) === normalizedInput);
    }

    return false;
  });

  // If genuine verified match found
  if (matchedPhrase) {
    return {
      status: 'VERIFIED_PRIMER_MATCH',
      isVerified: true,
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

  // Honest unverified handling: Do NOT display an unrelated translation!
  return {
    status: 'NOT_IN_CURATED_PRIMER',
    isVerified: false,
    hindiInput: trimmed,
    santhaliOlChiki: null,
    santhaliRoman: null,
    santhaliDevanagari: null,
    english: null,
    teacherTip: null,
    message: `वाक्य क्यूरेटेड प्राथमिक प्राइमर में उपलब्ध नहीं है: "${trimmed}"`,
    explanation: `सटीकता सुरक्षा (Accuracy Safeguard): आपके द्वारा दर्ज किया गया वाक्य ("${trimmed}") प्राथमिक कक्षा प्राइमर शब्दकोश में शामिल नहीं है। भाषाई शुद्धता बनाए रखने के लिए, हम किसी असंबंधित वाक्य (जैसे 'हाथ धोकर खाना खाएं') का गलत अनुवाद नहीं दिखाते और न ही मनगढ़ंत अनुवाद बनाते हैं।`,
    demoNotice: 'Notice: This specific sentence is not in the verified classroom primer. To translate arbitrary uncurated sentences without linguistic hallucination, connect an AI translation engine (AI4Bharat IndicTrans2 or Bhashini).',
    suggestedPhrases: CURATED_CLASSROOM_PHRASES.slice(0, 4)
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

  await new Promise((resolve) => setTimeout(resolve, 250));

  const normalizedInput = normalizeText(trimmed);

  // 1. Strict match in student expressions
  let matchedStudent = CURATED_STUDENT_SANTHALI_PHRASES.find(phrase => {
    const normRoman = normalizeText(phrase.santhaliRoman);
    const normOlChiki = (phrase.santhaliOlChiki || '').trim();
    const normDev = (phrase.santhaliDevanagari || '').trim();

    if (normalizedInput === normRoman || trimmed === normOlChiki || trimmed === normDev) {
      return true;
    }

    if (phrase.validVariants && phrase.validVariants.length > 0) {
      return phrase.validVariants.some(v => normalizeText(v) === normalizedInput || v === trimmed);
    }

    return false;
  });

  if (matchedStudent) {
    return {
      status: 'VERIFIED_STUDENT_MATCH',
      isVerified: true,
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

  // 2. Strict match in general classroom phrases
  let matchedGeneral = CURATED_CLASSROOM_PHRASES.find(phrase => {
    const normRoman = normalizeText(phrase.santhaliRoman);
    const normOlChiki = (phrase.santhaliOlChiki || '').trim();
    const normDev = (phrase.santhaliDevanagari || '').trim();

    return normalizedInput === normRoman || trimmed === normOlChiki || trimmed === normDev;
  });

  if (matchedGeneral) {
    return {
      status: 'VERIFIED_PRIMER_MATCH',
      isVerified: true,
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

  // Honest unverified fallback: Do NOT display an unrelated translation!
  return {
    status: 'NOT_IN_CURATED_PRIMER',
    isVerified: false,
    santhaliInput: trimmed,
    santhaliOlChiki: trimmed,
    santhaliRoman: trimmed,
    hindiTranslation: null,
    englishMeaning: null,
    message: `संथाली वाक्य प्राथमिक प्राइमर में उपलब्ध नहीं है: "${trimmed}"`,
    teacherAdvice: 'यह संथाली वाक्य सत्यापित छात्र प्राइमर सूची में नहीं मिला। मनगढ़ंत या गलत अनुवाद से बचने के लिए, कृपया नीचे दिए गए सत्यापित छात्र वाक्यों में से चुनें या AI4Bharat / Bhashini API जोड़ें।',
    demoNotice: 'Notice: This Santhali phrase is not in the verified student primer. To translate arbitrary uncurated phrases, connect an Indic translation engine (AI4Bharat IndicTrans2 or Bhashini).',
    suggestedPhrases: CURATED_STUDENT_SANTHALI_PHRASES.slice(0, 4)
  };
};
