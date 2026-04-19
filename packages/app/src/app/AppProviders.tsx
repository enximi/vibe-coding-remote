import type { PropsWithChildren } from 'react';
import { PreferencesProvider } from '../features/preferences/PreferencesContext';
import { BridgeProvider } from '../features/runtime/BridgeContext';
import { ConnectionConfigProvider } from '../features/runtime/ConnectionConfigContext';
import { ConnectionProvider } from '../features/runtime/ConnectionContext';
import type { VibeCodingRemoteBridge } from '../shared/contracts/bridge';

export function AppProviders({
  bridge,
  children,
}: PropsWithChildren<{ bridge: VibeCodingRemoteBridge }>) {
  return (
    <BridgeProvider bridge={bridge}>
      <ConnectionConfigProvider>
        <PreferencesProvider>
          <ConnectionProvider>{children}</ConnectionProvider>
        </PreferencesProvider>
      </ConnectionConfigProvider>
    </BridgeProvider>
  );
}
