import type { PropsWithChildren } from 'react';
import { PreferencesProvider } from '../../features/preferences/model/PreferencesContext';
import { BridgeProvider } from '../../features/runtime/model/BridgeContext';
import { ConnectionProvider } from '../../features/runtime/model/ConnectionContext';
import type { VibeCodingRemoteBridge } from '../../types/bridge';

export function AppProviders({
  bridge,
  children,
}: PropsWithChildren<{ bridge: VibeCodingRemoteBridge }>) {
  return (
    <BridgeProvider bridge={bridge}>
      <PreferencesProvider>
        <ConnectionProvider>{children}</ConnectionProvider>
      </PreferencesProvider>
    </BridgeProvider>
  );
}
