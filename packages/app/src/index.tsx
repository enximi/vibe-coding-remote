import type { VibeCodingRemoteBridge } from './types/bridge';
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

export * from './constants/network';
export * from './constants/storage';
export * from './types/bridge';
export * from './types/server';
export * from './utils/action';
export * from './utils/endpoint';
