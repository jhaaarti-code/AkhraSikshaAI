/**
 * Vercel Serverless Function for /api/transcribe
 *
 * When AkhraSiksha AI is deployed on Vercel, this serverless route (/api/transcribe)
 * handles speech recognition requests for Santhali.
 */

import { processTranscribeRequest } from '../server/transcribeApi.js';

export default async function handler(req, res) {
  // Set CORS headers for universal browser access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({
      ok: false,
      errorCode: 'METHOD_NOT_ALLOWED',
      message: 'Only POST requests are supported on /api/transcribe.'
    });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      res.status(400).json({
        ok: false,
        errorCode: 'INVALID_JSON',
        message: 'Request body must be valid JSON.'
      });
      return;
    }
  }

  try {
    const result = await processTranscribeRequest({
      audio: body?.audio,
      phoneticText: body?.phoneticText,
      alternatives: body?.alternatives || [],
      mimeType: body?.mimeType || 'audio/webm'
    });

    res.status(result.httpStatus).json(result.body);
  } catch (err) {
    res.status(500).json({
      ok: false,
      errorCode: 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred during transcription.'
    });
  }
}
