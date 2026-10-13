/**
 * Standalone Node.js Backend Server for AkhraSiksha AI (/api/translate)
 *
 * Note: During development (`npm run dev`), Vite automatically mounts the
 * `/api/translate` middleware from `./translateApi.js` on port 5173.
 * You can also run this standalone server directly via `node server/index.js`.
 */

import http from 'node:http';
import { createTranslateMiddleware } from './translateApi.js';

const PORT = process.env.PORT || 3001;
const translateMiddleware = createTranslateMiddleware();

const server = http.createServer((req, res) => {
  // Basic CORS headers for local frontend development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  translateMiddleware(req, res, () => {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ ok: false, message: 'Endpoint not found. Use POST /api/translate.' }));
  });
});

server.listen(PORT, () => {
  console.log(`AkhraSiksha AI Backend running at http://localhost:${PORT}/api/translate`);
});
