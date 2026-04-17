import type { VibeCodingRemoteBridge } from '@vibe-coding-remote/shared';
import { StrictMode } from 'react';
import { AppShell } from './app/AppShell';
import { BridgeProvider } from './features/runtime/bridge/BridgeContext';
import './styles/index.css';

export function VibeCodingRemoteApp({ bridge }: { bridge: VibeCodingRemoteBridge }) {
  return (
    <StrictMode>
      <BridgeProvider bridge={bridge}>
        <AppShell />
      </BridgeProvider>
    </StrictMode>
  );
}
