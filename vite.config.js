import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createTranslateMiddleware } from './server/translateApi.js';
import { createTranscribeMiddleware } from './server/transcribeApi.js';

function akhraTranslateBackendPlugin() {
  const translateMiddleware = createTranslateMiddleware();
  const transcribeMiddleware = createTranscribeMiddleware();
  return {
    name: 'akhra-translate-backend',
    configureServer(server) {
      server.middlewares.use(translateMiddleware);
      server.middlewares.use(transcribeMiddleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(translateMiddleware);
      server.middlewares.use(transcribeMiddleware);
    }
  };
}

export default defineConfig({
  plugins: [react(), akhraTranslateBackendPlugin()],
  server: {
    port: 5173,
    host: true,
    open: false
  }
});
