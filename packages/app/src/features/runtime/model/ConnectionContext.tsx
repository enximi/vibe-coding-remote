import { createContext, type PropsWithChildren, useContext } from 'react';
import type { ConnectionStatus } from './connectionMachine';
import { useConnectionConfig } from './ConnectionConfigContext';
import { useConnectionState } from './useConnectionState';

export type ConnectionContextValue = {
  status: ConnectionStatus;
  recheckConnection: () => void;
};

const ConnectionContext = createContext<ConnectionContextValue | null>(null);

export function ConnectionProvider({ children }: PropsWithChildren) {
  const { serverEndpoint, serverAuthToken } = useConnectionConfig();
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
