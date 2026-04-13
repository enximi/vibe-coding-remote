import { StrictMode } from 'react';
import type { VoiceBridgeBridge } from '@voice-bridge/shared';
import App from './App';
import { BridgeProvider } from './features/runtime/BridgeContext';
import './styles/index.css';

export function VoiceBridgeApp({ bridge }: { bridge: VoiceBridgeBridge }) {
  return (
    <StrictMode>
      <BridgeProvider bridge={bridge}>
        <App />
      </BridgeProvider>
    </StrictMode>
  );
}
