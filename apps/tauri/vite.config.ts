import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const devHost = process.env.TAURI_DEV_HOST;

export default defineConfig(() => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@voice-bridge/app': fileURLToPath(new URL('../../packages/app/src/index.tsx', import.meta.url)),
      '@voice-bridge/shared': fileURLToPath(new URL('../../packages/shared/src/index.ts', import.meta.url)),
    },
    dedupe: ['react', 'react-dom'],
  },
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: devHost || false,
    hmr: devHost
      ? {
          protocol: 'ws',
          host: devHost,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },
}));
