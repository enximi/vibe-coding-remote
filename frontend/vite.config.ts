import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const RUST_API_URL = 'http://127.0.0.1:8765';

export default defineConfig({
  plugins: [react()],
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
