/**
 * Santhali Speech & Phonetic Matching Engine for AkhraSiksha AI
 * 
 * Provides cross-browser acoustic and phonetic recognition adaptation for Santhali.
 * Bridges standard browser speech recognition engines and raw audio recordings
 * to authentic Santhali vocabulary (Romanized, Ol Chiki, and Devanagari).
 */

import { CURATED_CLASSROOM_PHRASES, CURATED_STUDENT_SANTHALI_PHRASES } from '../data/curatedPhrases.js';
import { containsOlChikiScript } from './olChikiTransliterator.js';

/**
 * Normalizes text for robust phonetic comparison:
 * Strips punctuation, trims whitespace, converts to lowercase,
 * and harmonizes common phonetic ambiguities across Indic/Roman scripts.
 */
export const normalizePhonetic = (str = '') => {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .replace(/[।.,!?।\-_:;"'()[\]{}~`\\/]/g, ' ')
    // Normalize Hindi retroflex/nasal variants
    .replace(/़/g, '') // remove nukta
    .replace(/ँ/g, 'ं') // candrabindu to anusvara
    .replace(/ड़/g, 'ड')
    .replace(/ढ़/g, 'ढ')
    .replace(/ञ/g, 'न')
    .replace(/ङ/g, 'न')
    .replace(/ण/g, 'न')
    .replace(/श/g, 'स')
    .replace(/ष/g, 'स')
    // Normalize Roman characters
    .replace(/[ñ]/g, 'n')
    .replace(/[ṛ]/g, 'r')
    .replace(/[ḍ]/g, 'd')
    .replace(/[ṭ]/g, 't')
    .replace(/[ạ]/g, 'a')
    .replace(/[ẽ]/g, 'e')
    .replace(/[õ]/g, 'o')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Calculates Levenshtein distance between two normalized strings
 */
export const levenshteinDistance = (a, b) => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
};

/**
 * Calculates string similarity ratio from 0.0 to 1.0
 */
export const calculateSimilarity = (str1, str2) => {
  const norm1 = normalizePhonetic(str1).replace(/\s+/g, '');
  const norm2 = normalizePhonetic(str2).replace(/\s+/g, '');

  if (!norm1 || !norm2) return 0;
  if (norm1 === norm2) return 1.0;

  const distance = levenshteinDistance(norm1, norm2);
  const maxLength = Math.max(norm1.length, norm2.length);
  return 1 - distance / maxLength;
};

// Build comprehensive indexed lookup table of Santhali phrases
// Full student expressions and classroom sentences are prioritized before single keywords
const FULL_PHRASES = [
  ...CURATED_STUDENT_SANTHALI_PHRASES.map(p => ({
    ...p,
    source: 'student_expression',
    primaryRoman: p.santhaliRoman,
    primaryOlChiki: p.santhaliOlChiki,
    primaryDevanagari: p.santhaliDevanagari,
    allVariants: [
      p.santhaliRoman,
      p.santhaliOlChiki,
      p.santhaliDevanagari,
      ...(p.validVariants || [])
    ]
  })),
  ...CURATED_CLASSROOM_PHRASES.map(p => ({
    ...p,
    source: 'classroom_primer',
    primaryRoman: p.santhaliRoman,
    primaryOlChiki: p.santhaliOlChiki,
    primaryDevanagari: p.santhaliDevanagari,
    allVariants: [
      p.santhaliRoman,
      p.santhaliOlChiki,
      p.santhaliDevanagari,
      ...(p.validVariants || [])
    ]
  }))
];

const KEYWORDS_AND_NUMBERS = [
  // Additional common individual Santhali greetings, numbers & keywords
  {
    id: 'kw-johar',
    source: 'keyword',
    santhaliRoman: 'Johar',
    santhaliOlChiki: 'ᱡᱚᱦᱟᱨ',
    santhaliDevanagari: 'जोहार',
    hindi: 'नमस्ते / प्रणाम',
    english: 'Greetings / Respectful Hello',
    allVariants: ['johar', 'जोहार', 'जोहर', 'ᱡᱚᱦᱟᱨ', 'namaste', 'zohar']
  },
  {
    id: 'kw-machet',
    source: 'keyword',
    santhaliRoman: 'Machet',
    santhaliOlChiki: 'ᱢᱟᱪᱮᱛ',
    santhaliDevanagari: 'माचेत',
    hindi: 'शिक्षक / गुरुजी',
    english: 'Teacher',
    allVariants: ['machet', 'माचेत', 'मचेत', 'ᱢᱟᱪᱮᱛ', 'master', 'guru']
  },
  {
    id: 'kw-gidra',
    source: 'keyword',
    santhaliRoman: 'Gidra',
    santhaliOlChiki: 'ᱜᱤᱫᱽᱨᱟᱹ',
    santhaliDevanagari: 'गिदरा',
    hindi: 'बच्चा / बालक',
    english: 'Child',
    allVariants: ['gidra', 'गिदरा', 'गिदड़', 'ᱜᱤᱫᱽᱨᱟᱹ', 'gidra ko']
  },
  {
    id: 'kw-puthi',
    source: 'keyword',
    santhaliRoman: 'Puthi',
    santhaliOlChiki: 'ᱯᱩᱛᱷᱤ',
    santhaliDevanagari: 'पुथी',
    hindi: 'किताब / पुस्तक',
    english: 'Book / Primer',
    allVariants: ['puthi', 'पुथी', 'पोथी', 'ᱯᱩᱛᱷᱤ', 'pothi']
  },
  {
    id: 'kw-dah',
    source: 'keyword',
    santhaliRoman: 'Dah',
    santhaliOlChiki: 'ᱫᱟᱜ',
    santhaliDevanagari: 'दाह',
    hindi: 'पानी / जल',
    english: 'Water',
    allVariants: ['dah', 'daag', 'दाह', 'दाग', 'ᱫᱟᱜ', 'pani']
  },
  {
    id: 'kw-he',
    source: 'keyword',
    santhaliRoman: 'Hẽ',
    santhaliOlChiki: 'ᱦᱮᱸ',
    santhaliDevanagari: 'हें',
    hindi: 'हाँ',
    english: 'Yes',
    allVariants: ['he', 'hẽ', 'हें', 'हे', 'हाँ', 'ᱦᱮᱸ']
  },
  {
    id: 'kw-ban',
    source: 'keyword',
    santhaliRoman: 'Bang',
    santhaliOlChiki: 'ᱵᱟᱝ',
    santhaliDevanagari: 'बां',
    hindi: 'नहीं',
    english: 'No',
    allVariants: ['bang', 'bañ', 'बां', 'बांग', 'नहीं', 'ᱵᱟᱝ']
  },
  {
    id: 'kw-num-1',
    source: 'number',
    santhaliRoman: 'Mit',
    santhaliOlChiki: 'ᱢᱤᱫ',
    santhaliDevanagari: 'मिद',
    hindi: 'एक (1)',
    english: 'One (1)',
    allVariants: ['mit', 'mid', 'मिद', 'मित', 'एक', 'ᱢᱤᱫ']
  },
  {
    id: 'kw-num-2',
    source: 'number',
    santhaliRoman: 'Bar',
    santhaliOlChiki: 'ᱵᱟᱨ',
    santhaliDevanagari: 'बार',
    hindi: 'दो (2)',
    english: 'Two (2)',
    allVariants: ['bar', 'बार', 'दो', 'ᱵᱟᱨ']
  },
  {
    id: 'kw-num-3',
    source: 'number',
    santhaliRoman: 'Pe',
    santhaliOlChiki: 'ᱯᱮ',
    santhaliDevanagari: 'पे',
    hindi: 'तीन (3)',
    english: 'Three (3)',
    allVariants: ['pe', 'पे', 'तीन', 'ᱯᱮ']
  },
  {
    id: 'kw-num-4',
    source: 'number',
    santhaliRoman: 'Pon',
    santhaliOlChiki: 'ᱯᱩᱱ',
    santhaliDevanagari: 'पून',
    hindi: 'चार (4)',
    english: 'Four (4)',
    allVariants: ['pon', 'pun', 'पून', 'पोन', 'चार', 'ᱯᱩᱱ']
  },
  {
    id: 'kw-num-5',
    source: 'number',
    santhaliRoman: 'More',
    santhaliOlChiki: 'ᱢᱚᱬᱮ',
    santhaliDevanagari: 'मोणे',
    hindi: 'पाँच (5)',
    english: 'Five (5)',
    allVariants: ['more', 'mone', 'मोणे', 'मोरे', 'पाँच', 'पांच', 'ᱢᱚᱬᱮ']
  }
];

const SANTHALI_CORPUS = [...FULL_PHRASES, ...KEYWORDS_AND_NUMBERS];

/**
 * Devanagari to Ol Chiki and Roman Transliteration Map
 */
const DEVANAGARI_TO_SANTHALI = {
  // Independent Vowels
  'अ': { roman: 'a', ol: 'ᱚ' },
  'आ': { roman: 'a', ol: 'ᱟ' },
  'इ': { roman: 'i', ol: 'ᱤ' },
  'ई': { roman: 'i', ol: 'ᱤ' },
  'उ': { roman: 'u', ol: 'ᱩ' },
  'ऊ': { roman: 'u', ol: 'ᱩ' },
  'ए': { roman: 'e', ol: 'ᱮ' },
  'ऐ': { roman: 'e', ol: 'ᱮ' },
  'ओ': { roman: 'o', ol: 'ᱳ' },
  'औ': { roman: 'o', ol: 'ᱳ' },

  // Matras (Vowel signs)
  'ा': { roman: 'a', ol: 'ᱟ' },
  'ि': { roman: 'i', ol: 'ᱤ' },
  'ी': { roman: 'i', ol: 'ᱤ' },
  'ु': { roman: 'u', ol: 'ᱩ' },
  'ू': { roman: 'u', ol: 'ᱩ' },
  'े': { roman: 'e', ol: 'ᱮ' },
  'ै': { roman: 'e', ol: 'ᱮ' },
  'ो': { roman: 'o', ol: 'ᱳ' },
  'ौ': { roman: 'o', ol: 'ᱳ' },

  // Consonants
  'क': { roman: 'k', ol: 'ᱠ' },
  'ख': { roman: 'kh', ol: 'ᱠᱷ' },
  'ग': { roman: 'g', ol: 'ᱜ' },
  'घ': { roman: 'gh', ol: 'ᱜᱷ' },
  'ङ': { roman: 'ng', ol: 'ᱝ' },
  'च': { roman: 'ch', ol: 'ᱪ' },
  'छ': { roman: 'chh', ol: 'ᱪᱷ' },
  'ज': { roman: 'j', ol: 'ᱡ' },
  'झ': { roman: 'jh', ol: 'ᱡᱷ' },
  'ञ': { roman: 'ñ', ol: 'ᱧ' },
  'ट': { roman: 'ṭ', ol: 'ᱴ' },
  'ठ': { roman: 'ṭh', ol: 'ᱴᱷ' },
  'ड': { roman: 'ḍ', ol: 'ᱰ' },
  'ढ': { roman: 'ḍh', ol: 'ᱰᱷ' },
  'ण': { roman: 'ṇ', ol: 'ᱬ' },
  'त': { roman: 't', ol: 'ᱛ' },
  'थ': { roman: 'th', ol: 'ᱛᱷ' },
  'द': { roman: 'd', ol: 'ᱫ' },
  'ध': { roman: 'dh', ol: 'ᱫᱷ' },
  'न': { roman: 'n', ol: 'ᱱ' },
  'प': { roman: 'p', ol: 'ᱯ' },
  'फ': { roman: 'ph', ol: 'ᱯᱷ' },
  'ब': { roman: 'b', ol: 'ᱵ' },
  'भ': { roman: 'bh', ol: 'ᱵᱷ' },
  'म': { roman: 'm', ol: 'ᱢ' },
  'य': { roman: 'y', ol: 'ᱭ' },
  'र': { roman: 'r', ol: 'ᱨ' },
  'ल': { roman: 'l', ol: 'ᱞ' },
  'व': { roman: 'w', ol: 'ᱣ' },
  'श': { roman: 's', ol: 'ᱥ' },
  'ष': { roman: 's', ol: 'ᱥ' },
  'स': { roman: 's', ol: 'ᱥ' },
  'ह': { roman: 'h', ol: 'ᱦ' },
  'ड़': { roman: 'ṛ', ol: 'ᱲ' },
  'ढ़': { roman: 'ṛh', ol: 'ᱲᱷ' },

  // Signs
  'ं': { roman: '̃', ol: 'ᱸ' },
  'ँ': { roman: '̃', ol: 'ᱸ' },
  '़': { roman: 'ạ', ol: 'ᱹ' },
  '्': { roman: '', ol: 'ᱽ' },
  '।': { roman: '.', ol: '᱾' }
};

/**
 * Transliterates Devanagari text to Roman Santhali and Ol Chiki script.
 */
export const transliterateDevanagariToSanthali = (text = '') => {
  if (!text || typeof text !== 'string') {
    return { roman: '', olChiki: '' };
  }

  let romanOut = '';
  let olChikiOut = '';
  let prevIsConsonant = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === ' ' || char === '\n' || char === '\t') {
      romanOut += ' ';
      olChikiOut += ' ';
      prevIsConsonant = false;
      continue;
    }

    const mapping = DEVANAGARI_TO_SANTHALI[char];
    if (!mapping) {
      romanOut += char;
      olChikiOut += char;
      prevIsConsonant = false;
      continue;
    }

    const isMatra = 'ािीुूेैोौ'.includes(char);
    const isVirama = char === '्';

    if (isMatra) {
      romanOut += mapping.roman;
      olChikiOut += mapping.ol;
      prevIsConsonant = false;
    } else if (isVirama) {
      olChikiOut += mapping.ol;
      prevIsConsonant = false;
    } else {
      // Consonant or independent vowel
      const isConsonant = 'कखगघङचछजझञटठडढणतथदधनपफबभमयरलवशषसहड़ढ़'.includes(char);
      if (prevIsConsonant && isConsonant) {
        // In Hindi speech recognition, inherent 'a' is assumed between unjoined consonants
        romanOut += 'a';
      }
      romanOut += mapping.roman;
      olChikiOut += mapping.ol;
      prevIsConsonant = isConsonant;
    }
  }

  const cleanRoman = romanOut.replace(/\s+/g, ' ').trim();
  const cleanOl = olChikiOut.replace(/\s+/g, ' ').trim();

  return {
    roman: cleanRoman ? cleanRoman.charAt(0).toUpperCase() + cleanRoman.slice(1) : '',
    olChiki: cleanOl
  };
};

/**
 * Matches recognized speech (from any browser speech recognition or audio STT)
 * against the verified Santhali classroom corpus using phonetic normalization
 * and fuzzy distance.
 *
 * @param {string} rawTranscript - Spoken transcript from speech recognizer
 * @param {Array<{transcript: string, confidence: number}>} alternatives - Optional candidate variants
 * @returns {Object} Best matched Santhali phrase object or transliterated representation
 */
export const matchSanthaliSpeech = (rawTranscript = '', alternatives = []) => {
  const trimmed = (rawTranscript || '').trim();
  if (!trimmed) {
    return null;
  }

  // Already contains Ol Chiki script
  if (containsOlChikiScript(trimmed)) {
    const exactMatch = SANTHALI_CORPUS.find(
      p => (p.primaryOlChiki && p.primaryOlChiki.trim() === trimmed) ||
           (p.santhaliOlChiki && p.santhaliOlChiki.trim() === trimmed)
    );

    if (exactMatch) {
      return {
        matched: true,
        phrase: exactMatch,
        santhaliRoman: exactMatch.santhaliRoman,
        santhaliOlChiki: exactMatch.santhaliOlChiki,
        santhaliDevanagari: exactMatch.santhaliDevanagari,
        confidence: 0.99,
        matchType: 'exact_ol_chiki',
        rawTranscript: trimmed
      };
    }
  }

  // Collect all candidate strings to test: main transcript + top alternatives
  const candidateTexts = [
    trimmed,
    ...alternatives.map(a => a?.transcript).filter(Boolean)
  ];

  let bestMatch = null;
  let highestScore = 0;

  // 1. Pass 1: Exact normalized match across FULL_PHRASES and KEYWORDS
  for (const candidate of candidateTexts) {
    const normCand = normalizePhonetic(candidate);
    if (!normCand) continue;

    for (const item of FULL_PHRASES) {
      for (const variant of item.allVariants) {
        if (!variant) continue;
        if (normCand === normalizePhonetic(variant)) {
          return {
            matched: true,
            phrase: item,
            santhaliRoman: item.santhaliRoman,
            santhaliOlChiki: item.santhaliOlChiki,
            santhaliDevanagari: item.santhaliDevanagari,
            confidence: 1.0,
            matchType: 'exact_phonetic',
            rawTranscript: candidate
          };
        }
      }
    }

    for (const item of KEYWORDS_AND_NUMBERS) {
      for (const variant of item.allVariants) {
        if (!variant) continue;
        if (normCand === normalizePhonetic(variant)) {
          return {
            matched: true,
            phrase: item,
            santhaliRoman: item.santhaliRoman,
            santhaliOlChiki: item.santhaliOlChiki,
            santhaliDevanagari: item.santhaliDevanagari,
            confidence: 0.98,
            matchType: 'exact_keyword',
            rawTranscript: candidate
          };
        }
      }
    }
  }

  // 2. Pass 2: Substring & fuzzy matches in FULL_PHRASES
  for (const candidate of candidateTexts) {
    const normCand = normalizePhonetic(candidate);
    if (!normCand) continue;

    for (const item of FULL_PHRASES) {
      for (const variant of item.allVariants) {
        if (!variant) continue;
        const normVar = normalizePhonetic(variant);

        // Substring check
        if (normCand.length >= 3 && normVar.length >= 3) {
          if (normCand.includes(normVar) || normVar.includes(normCand)) {
            const minLen = Math.min(normCand.length, normVar.length);
            const maxLen = Math.max(normCand.length, normVar.length);
            const ratio = minLen / maxLen;
            const score = 0.82 + (ratio * 0.16);
            if (score > highestScore) {
              highestScore = score;
              bestMatch = { item, score, matchType: 'substring_match', rawTranscript: candidate };
            }
          }
        }

        // Fuzzy Levenshtein similarity
        const sim = calculateSimilarity(normCand, normVar);
        if (sim > highestScore) {
          highestScore = sim;
          bestMatch = { item, score: sim, matchType: 'fuzzy_similarity', rawTranscript: candidate };
        }
      }
    }
  }

  // If a full phrase matched with good confidence (>= 0.60), use it!
  if (bestMatch && bestMatch.score >= 0.60) {
    return {
      matched: true,
      phrase: bestMatch.item,
      santhaliRoman: bestMatch.item.santhaliRoman,
      santhaliOlChiki: bestMatch.item.santhaliOlChiki,
      santhaliDevanagari: bestMatch.item.santhaliDevanagari,
      confidence: Math.round(bestMatch.score * 100) / 100,
      matchType: bestMatch.matchType,
      rawTranscript: bestMatch.rawTranscript
    };
  }

  // 2. Only if no full expression matched, search single keywords and numbers
  for (const candidate of candidateTexts) {
    const normCand = normalizePhonetic(candidate);
    if (!normCand) continue;

    for (const item of KEYWORDS_AND_NUMBERS) {
      for (const variant of item.allVariants) {
        if (!variant) continue;
        const normVar = normalizePhonetic(variant);

        if (normCand === normVar) {
          return {
            matched: true,
            phrase: item,
            santhaliRoman: item.santhaliRoman,
            santhaliOlChiki: item.santhaliOlChiki,
            santhaliDevanagari: item.santhaliDevanagari,
            confidence: 0.95,
            matchType: 'exact_keyword',
            rawTranscript: candidate
          };
        }

        const sim = calculateSimilarity(normCand, normVar);
        if (sim > highestScore) {
          highestScore = sim;
          bestMatch = { item, score: sim, matchType: 'fuzzy_keyword', rawTranscript: candidate };
        }
      }
    }
  }

  // If a keyword matched with high confidence (>= 0.75)
  if (bestMatch && bestMatch.score >= 0.75) {
    return {
      matched: true,
      phrase: bestMatch.item,
      santhaliRoman: bestMatch.item.santhaliRoman,
      santhaliOlChiki: bestMatch.item.santhaliOlChiki,
      santhaliDevanagari: bestMatch.item.santhaliDevanagari,
      confidence: Math.round(bestMatch.score * 100) / 100,
      matchType: bestMatch.matchType,
      rawTranscript: bestMatch.rawTranscript
    };
  }

  // Fallback: If free-form speech not in primer, provide clean phonetic transliteration
  const isDevanagari = /[\u0900-\u097F]/.test(trimmed);
  if (isDevanagari) {
    const translit = transliterateDevanagariToSanthali(trimmed);
    return {
      matched: false,
      phrase: null,
      santhaliRoman: translit.roman || trimmed,
      santhaliOlChiki: translit.olChiki || trimmed,
      santhaliDevanagari: trimmed,
      confidence: 0.75,
      matchType: 'phonetic_transliteration',
      rawTranscript: trimmed
    };
  }

  // Latin / English phonetic input
  return {
    matched: false,
    phrase: null,
    santhaliRoman: trimmed.charAt(0).toUpperCase() + trimmed.slice(1),
    santhaliOlChiki: trimmed,
    santhaliDevanagari: trimmed,
    confidence: 0.70,
    matchType: 'direct_input',
    rawTranscript: trimmed
  };
};
