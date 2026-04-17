import { StrictMode } from 'react';
import type { VibeCodingRemoteBridge } from '@vibe-coding-remote/shared';
import App from './App';
import { BridgeProvider } from './features/runtime/BridgeContext';
import './styles/index.css';

export function VibeCodingRemoteApp({ bridge }: { bridge: VibeCodingRemoteBridge }) {
  return (
    <StrictMode>
      <BridgeProvider bridge={bridge}>
        <App />
      </BridgeProvider>
    </StrictMode>
  );
}
