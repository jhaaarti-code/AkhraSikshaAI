/**
 * Vercel Serverless Function for /api/translate
 *
 * When AkhraSiksha AI is deployed on Vercel, Vercel automatically exposes
 * any file in the `/api` directory as an API route (/api/translate).
 * This function delegates directly to our core translation processor in
 * `server/translateApi.js`.
 */

import { processTranslationRequest } from '../server/translateApi.js';

export default async function handler(req, res) {
  // Set CORS headers for security and browser access
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
      message: 'Only POST requests are supported on /api/translate.'
    });
    return;
  }

  // Parse body if Vercel did not already parse it as an object
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
    const result = await processTranslationRequest({
      text: body?.text,
      sourceLang: body?.sourceLang || 'hi',
      targetLang: body?.targetLang || 'sat'
    });

    res.status(result.httpStatus).json(result.body);
  } catch (err) {
    res.status(500).json({
      ok: false,
      errorCode: 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred during translation.'
    });
  }
}
