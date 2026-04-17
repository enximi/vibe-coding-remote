import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const httpsCertPath = fileURLToPath(new URL('../../.cert/dev-cert.pem', import.meta.url));
const httpsKeyPath = fileURLToPath(new URL('../../.cert/dev-key.pem', import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@vibe-coding-remote/app': fileURLToPath(
        new URL('../../packages/app/src/index.tsx', import.meta.url),
      ),
    },
    dedupe: ['react', 'react-dom'],
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    https: {
      cert: readFileSync(httpsCertPath),
      key: readFileSync(httpsKeyPath),
    },
  },
});
