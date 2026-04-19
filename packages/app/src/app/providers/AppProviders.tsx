import type { PropsWithChildren } from 'react';
import { PreferencesProvider } from '../../features/preferences/model/PreferencesContext';
import { BridgeProvider } from '../../features/runtime/model/BridgeContext';
import { ConnectionConfigProvider } from '../../features/runtime/model/ConnectionConfigContext';
import { ConnectionProvider } from '../../features/runtime/model/ConnectionContext';
import type { VibeCodingRemoteBridge } from '../../types/bridge';

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
