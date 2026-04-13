import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const RUST_API_URL = 'http://127.0.0.1:8765';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@voice-bridge/app': fileURLToPath(new URL('../../packages/app/src/index.tsx', import.meta.url)),
      '@voice-bridge/shared': fileURLToPath(new URL('../../packages/shared/src/index.ts', import.meta.url)),
    },
    dedupe: ['react', 'react-dom'],
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    hmr: {
      clientPort: 5173,
    },
    proxy: {
      '/api': {
        target: RUST_API_URL,
        changeOrigin: true,
      },
    },
  },
});
