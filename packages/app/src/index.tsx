import { StrictMode } from 'react';
import { AppProviders } from './app/AppProviders';
import { AppShell } from './app/AppShell';
import type { VibeCodingRemoteBridge } from './types/bridge';
import './styles/index.css';

export function VibeCodingRemoteApp({ bridge }: { bridge: VibeCodingRemoteBridge }) {
  return (
    <StrictMode>
      <AppProviders bridge={bridge}>
        <AppShell />
      </AppProviders>
    </StrictMode>
  );
}

export * from './constants/network';
export * from './constants/storage';
export * from './types/bridge';
export * from './types/server';
export * from './utils/action';
export * from './utils/endpoint';
