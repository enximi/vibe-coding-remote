import { StrictMode } from 'react';
import { AppProviders } from './app/AppProviders';
import { AppShell } from './app/AppShell';
import type { VibeCodingRemoteBridge } from './shared/contracts/bridge';
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

export * from './shared/config/network';
export * from './shared/config/storage';
export * from './shared/contracts/bridge';
export * from './shared/contracts/server';
export * from './shared/utils/action';
export * from './shared/utils/endpoint';
