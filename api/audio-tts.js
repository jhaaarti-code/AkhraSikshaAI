/**
 * Vercel Serverless Function for /api/audio-tts
 *
 * Provides natural, human-sounding neural TTS audio stream for both
 * Santhali (Devanagari phonetics) and Hindi speech output.
 */

import { fetchNaturalTtsAudio } from '../server/transcribeApi.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const text = req.query.text || '';
  const lang = req.query.lang || 'hi';

  if (!text) {
    res.status(400).json({ ok: false, message: 'Missing text parameter.' });
    return;
  }

  try {
    const audioBuffer = await fetchNaturalTtsAudio({ text, lang });
    if (!audioBuffer) {
      res.status(400).json({ ok: false, message: 'Could not generate natural audio.' });
      return;
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.status(200).send(audioBuffer);
  } catch (err) {
    res.status(502).json({ ok: false, message: err.message || 'TTS upstream error' });
  }
}
