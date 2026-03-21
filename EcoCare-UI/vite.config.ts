import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { createVoiceSearchProxy } from './server/voiceSearchProxy';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const isProd = mode === 'production';
  return {
    build: {
      // Do not ship source maps to browsers in production (harder to reverse-engineer).
      sourcemap: !isProd,
    },
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'voice-search-proxy',
        configureServer(server) {
          server.middlewares.use(createVoiceSearchProxy(env.ELEVENLABS_API_KEY));
        },
        configurePreviewServer(server) {
          server.middlewares.use(createVoiceSearchProxy(env.ELEVENLABS_API_KEY));
        },
      },
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
    },
  };
});
