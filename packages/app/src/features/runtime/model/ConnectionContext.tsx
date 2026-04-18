import { createContext, type PropsWithChildren, useContext } from 'react';
import { usePreferences } from '../../preferences/model/PreferencesContext';
import type { ConnectionStatus } from './connectionMachine';
import { useConnectionState } from './useConnectionState';

export type ConnectionContextValue = {
  status: ConnectionStatus;
  checkConnection: (endpoint?: string, token?: string) => void;
};

const ConnectionContext = createContext<ConnectionContextValue | null>(null);

export function ConnectionProvider({ children }: PropsWithChildren) {
  const { serverEndpoint, serverAuthToken } = usePreferences();
  const connection = useConnectionState(serverEndpoint, serverAuthToken);

  return <ConnectionContext.Provider value={connection}>{children}</ConnectionContext.Provider>;
}

export function useConnection() {
  const connection = useContext(ConnectionContext);
  if (!connection) {
    throw new Error('Connection state is not available in the current app shell.');
  }

  return connection;
}
