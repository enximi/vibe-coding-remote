import { VibeCodingRemoteApp } from '@vibe-coding-remote/app';
import { createRoot } from 'react-dom/client';
import { createWebBridge } from './platform/bridge';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Web app root element "#root" was not found.');
}

createRoot(rootElement).render(<VibeCodingRemoteApp bridge={createWebBridge()} />);
