import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const httpsCertPath = fileURLToPath(new URL('../../.cert/dev-cert.pem', import.meta.url));
const httpsKeyPath = fileURLToPath(new URL('../../.cert/dev-key.pem', import.meta.url));

export default defineConfig(() => {
  const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1];
  const base =
    process.env.VITE_BASE_PATH ??
    (process.env.GITHUB_ACTIONS === 'true' && repoName ? `/${repoName}/` : '/');

  const https =
    existsSync(httpsCertPath) && existsSync(httpsKeyPath)
      ? {
          cert: readFileSync(httpsCertPath),
          key: readFileSync(httpsKeyPath),
        }
      : undefined;

  return {
    base,
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
      https,
    },
  };
});
