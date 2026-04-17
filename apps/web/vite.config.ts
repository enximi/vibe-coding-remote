import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@vibe-coding-remote/app': fileURLToPath(
        new URL('../../packages/app/src/index.tsx', import.meta.url),
      ),
      '@vibe-coding-remote/shared': fileURLToPath(
        new URL('../../packages/shared/src/index.ts', import.meta.url),
      ),
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
  },
});
