import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { createVoiceSearchProxy } from './server/voiceSearchProxy';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    build: {
      sourcemap: false,
    },
    css: {
      devSourcemap: false,
    },
    esbuild: {
      sourcemap: false,
    },
    plugins: [
      /* Must run before other plugins so this middleware is early in the stack and can handle POST /api/voice-search/transcribe before the /api proxy. */
      {
        name: 'voice-search-proxy',
        configureServer(server) {
          server.middlewares.use(createVoiceSearchProxy(env.ELEVENLABS_API_KEY));
        },
        configurePreviewServer(server) {
          server.middlewares.use(createVoiceSearchProxy(env.ELEVENLABS_API_KEY));
        },
      },
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify — file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      allowedHosts: [
        'trinova.it.com',
        'api.trinova.it.com',
        'localhost',
        '127.0.0.1',
      ],
      // When VITE_API_BASE_URL is unset, `/api/*` resolves on the dev server; forward to FastAPI (default :8000).
      // Do not proxy voice transcription: FastAPI has no such route; handled by voice-search-proxy middleware + ElevenLabs.
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
          bypass(req) {
            if (req.url?.startsWith('/api/voice-search')) {
              return false;
            }
          },
        },
      },
    },
  };
});
