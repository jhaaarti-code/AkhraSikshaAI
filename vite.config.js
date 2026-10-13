import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createTranslateMiddleware } from './server/translateApi.js';

function akhraTranslateBackendPlugin() {
  const middleware = createTranslateMiddleware();
  return {
    name: 'akhra-translate-backend',
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
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
