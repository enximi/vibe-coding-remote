import { createRoot } from 'react-dom/client';
import { VoiceBridgeApp } from '@voice-bridge/app';
import { createWebBridge } from './platform/bridge';

createRoot(document.getElementById('root')!).render(
  <VoiceBridgeApp bridge={createWebBridge()} />,
);
