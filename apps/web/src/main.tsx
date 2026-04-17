import { createRoot } from 'react-dom/client';
import { VibeCodingRemoteApp } from '@vibe-coding-remote/app';
import { createWebBridge } from './platform/bridge';

createRoot(document.getElementById('root')!).render(
  <VibeCodingRemoteApp bridge={createWebBridge()} />,
);
