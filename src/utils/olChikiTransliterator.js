/**
 * Ol Chiki (Santali Script, Unicode U+1C50..U+1C7F) Phonetic Approximation Utility
 *
 * IMPORTANT ACCURACY NOTE:
 * - Ol Chiki is an alphabetic script where characters correspond to phonemes.
 * - This utility provides an AUTOMATIC CHARACTER-BY-CHARACTER PHONETIC APPROXIMATION
 *   in Roman and Devanagari scripts to help teachers who cannot read Ol Chiki script
 *   enunciate machine-translated sentences.
 * - It is strictly an approximation (not a human-verified phonetic transcription)
 *   and must always be labelled as an approximation in the UI.
 */

const OL_CHIKI_REGEX = /[\u1C50-\u1C7F]/;

/**
 * Checks whether a string contains at least one Ol Chiki Unicode character (U+1C50..U+1C7F).
 * Note: Confirming the script is Ol Chiki only verifies the writing system, NOT translation accuracy.
 */
export const containsOlChikiScript = (text = '') => {
  if (!text || typeof text !== 'string') return false;
  return OL_CHIKI_REGEX.test(text);
};

// Aspirated digraphs with U+1C77 (ᱷ - OH)
const ASPIRATED_DIGRAPHS = {
  'ᱠᱷ': { roman: 'kh', deva: 'ख' },
  'ᱜᱷ': { roman: 'gh', deva: 'घ' },
  'ᱪᱷ': { roman: 'chh', deva: 'छ' },
  'ᱡᱷ': { roman: 'jh', deva: 'झ' },
  'ᱴᱷ': { roman: 'ṭh', deva: 'ठ' },
  'ᱰᱷ': { roman: 'ḍh', deva: 'ढ' },
  'ᱛᱷ': { roman: 'th', deva: 'थ' },
  'ᱫᱷ': { roman: 'dh', deva: 'ध' },
  'ᱯᱷ': { roman: 'ph', deva: 'फ' },
  'ᱵᱷ': { roman: 'bh', deva: 'भ' },
  'ᱲᱷ': { roman: 'ṛh', deva: 'ढ़' }
};

// Single Ol Chiki character map (U+1C50..U+1C7F)
const OL_CHIKI_CHAR_MAP = {
  // Digits
  '᱐': { roman: '0', deva: '०', type: 'digit' },
  '᱑': { roman: '1', deva: '१', type: 'digit' },
  '᱒': { roman: '2', deva: '२', type: 'digit' },
  '᱓': { roman: '3', deva: '३', type: 'digit' },
  '\u1C54': { roman: '4', deva: '४', type: 'digit' },
  '\u1C55': { roman: '5', deva: '५', type: 'digit' },
  '\u1C56': { roman: '6', deva: '६', type: 'digit' },
  '\u1C57': { roman: '7', deva: '७', type: 'digit' },
  '\u1C58': { roman: '8', deva: '८', type: 'digit' },
  '\u1C59': { roman: '9', deva: '९', type: 'digit' },

  // Vowels
  'ᱚ': { roman: 'o', deva: 'अ', matra: '', type: 'vowel' },
  'ᱟ': { roman: 'a', deva: 'आ', matra: 'ा', type: 'vowel' },
  'ᱤ': { roman: 'i', deva: 'इ', matra: 'ि', type: 'vowel' },
  'ᱩ': { roman: 'u', deva: 'उ', matra: 'ु', type: 'vowel' },
  'ᱮ': { roman: 'e', deva: 'ए', matra: 'े', type: 'vowel' },
  'ᱳ': { roman: 'o', deva: 'ओ', matra: 'ो', type: 'vowel' },

  // Consonants
  'ᱛ': { roman: 't', deva: 'त', type: 'consonant' },
  'ᱜ': { roman: 'g', deva: 'ग', type: 'consonant' },
  'ᱝ': { roman: 'ng', deva: 'ङ', type: 'consonant' },
  'ᱞ': { roman: 'l', deva: 'ल', type: 'consonant' },
  'ᱠ': { roman: 'k', deva: 'क', type: 'consonant' },
  'ᱡ': { roman: 'j', deva: 'ज', type: 'consonant' },
  'ᱢ': { roman: 'm', deva: 'म', type: 'consonant' },
  'ᱣ': { roman: 'w', deva: 'व', type: 'consonant' },
  'ᱥ': { roman: 's', deva: 'स', type: 'consonant' },
  'ᱦ': { roman: 'h', deva: 'ह', type: 'consonant' },
  'ᱧ': { roman: 'ñ', deva: 'ञ', type: 'consonant' },
  'ᱨ': { roman: 'r', deva: 'र', type: 'consonant' },
  'ᱪ': { roman: 'ch', deva: 'च', type: 'consonant' },
  'ᱫ': { roman: 'd', deva: 'द', type: 'consonant' },
  'ᱬ': { roman: 'ṇ', deva: 'ण', type: 'consonant' },
  'ᱭ': { roman: 'y', deva: 'य', type: 'consonant' },
  'ᱯ': { roman: 'p', deva: 'प', type: 'consonant' },
  'ᱰ': { roman: 'ḍ', deva: 'ड', type: 'consonant' },
  'ᱱ': { roman: 'n', deva: 'न', type: 'consonant' },
  'ᱲ': { roman: 'ṛ', deva: 'ड़', type: 'consonant' },
  'ᱴ': { roman: 'ṭ', deva: 'ट', type: 'consonant' },
  'ᱵ': { roman: 'b', deva: 'ब', type: 'consonant' },
  'ᱶ': { roman: 'w̃', deva: 'ँव', type: 'consonant' },
  'ᱷ': { roman: 'h', deva: 'ह', type: 'consonant' },

  // Modifiers & Punctuation
  'ᱸ': { roman: '̃', deva: 'ं', type: 'modifier' },
  'ᱹ': { roman: 'ạ', deva: 'ा', type: 'vowel_modifier' },
  'ᱺ': { roman: 'ạ̃', deva: 'ां', type: 'vowel_modifier' },
  'ᱻ': { roman: '', deva: '', type: 'modifier' },
  'ᱼ': { roman: '-', deva: '-', type: 'punct' },
  'ᱽ': { roman: '', deva: '्', type: 'ahad' },
  '᱾': { roman: '.', deva: '।', type: 'punct' },
  '᱿': { roman: '.', deva: '॥', type: 'punct' }
};

/**
 * Generates an approximate Roman and Devanagari phonetic guide from Ol Chiki text.
 * Returns null if the text does not contain reliable Ol Chiki characters.
 */
export const generateOlChikiPronunciationApproximation = (olChikiText = '') => {
  const trimmed = (olChikiText || '').trim();
  if (!trimmed || !containsOlChikiScript(trimmed)) {
    return null;
  }

  let romanOut = '';
  let devaOut = '';
  let prevWasConsonant = false;

  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    const nextCh = trimmed[i + 1] || '';
    const digraph = ch + nextCh;

    // 1. Check aspirated consonant digraph (e.g., ᱠᱷ -> kh / ख)
    if (ASPIRATED_DIGRAPHS[digraph]) {
      romanOut += ASPIRATED_DIGRAPHS[digraph].roman;
      devaOut += ASPIRATED_DIGRAPHS[digraph].deva;
      prevWasConsonant = true;
      i++; // Skip the aspiration marker ᱷ
      continue;
    }

    const mapped = OL_CHIKI_CHAR_MAP[ch];
    if (!mapped) {
      // Preserve spaces, Latin punctuation, or digits
      romanOut += ch;
      devaOut += ch;
      prevWasConsonant = false;
      continue;
    }

    if (mapped.type === 'consonant') {
      romanOut += mapped.roman;
      devaOut += mapped.deva;
      prevWasConsonant = true;
    } else if (mapped.type === 'vowel') {
      // Check if followed by Gahla Tudag (ᱹ) which modifies ᱚ/ᱟ/ᱮ/ᱳ
      if (nextCh === 'ᱹ') {
        if (ch === 'ᱚ' || ch === 'ᱟ') {
          romanOut += 'ạ';
          devaOut += prevWasConsonant ? 'ा' : 'अ';
        } else {
          romanOut += mapped.roman;
          devaOut += prevWasConsonant ? mapped.matra : mapped.deva;
        }
        prevWasConsonant = false;
        i++;
        continue;
      }

      romanOut += mapped.roman;
      if (prevWasConsonant) {
        devaOut += mapped.matra;
      } else {
        devaOut += mapped.deva;
      }
      prevWasConsonant = false;
    } else if (mapped.type === 'vowel_modifier') {
      // Standalone ᱹ after a consonant (e.g., ᱨᱹ -> rạ / रा)
      romanOut += mapped.roman;
      devaOut += prevWasConsonant ? mapped.deva : 'अ';
      prevWasConsonant = false;
    } else if (mapped.type === 'ahad') {
      // Ahad (ᱽ) marks a checked consonant or consonant cluster
      romanOut += mapped.roman;
      if (prevWasConsonant && nextCh && OL_CHIKI_CHAR_MAP[nextCh]?.type === 'consonant') {
        devaOut += '्';
      }
      prevWasConsonant = false;
    } else {
      romanOut += mapped.roman;
      devaOut += mapped.deva;
      prevWasConsonant = false;
    }
  }

  // Capitalize first letter of Roman approximation
  const cleanRoman = romanOut.replace(/\s+/g, ' ').trim();
  const formattedRoman = cleanRoman
    ? cleanRoman.charAt(0).toUpperCase() + cleanRoman.slice(1)
    : '';
  const cleanDeva = devaOut.replace(/\s+/g, ' ').trim();

  if (!formattedRoman && !cleanDeva) {
    return null;
  }

  return {
    romanApproximation: formattedRoman,
    devanagariApproximation: cleanDeva,
    isApproximation: true,
    approximationNote: 'Auto-generated character-by-character phonetic approximation from Ol Chiki script (Unverified).'
  };
};
