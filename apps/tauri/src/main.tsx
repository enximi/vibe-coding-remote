import ReactDOM from 'react-dom/client';
import { VoiceBridgeApp } from '@voice-bridge/app';
import { createTauriBridge } from './platform/bridge';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <VoiceBridgeApp bridge={createTauriBridge()} />,
);
