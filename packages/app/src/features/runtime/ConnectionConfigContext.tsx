import { createContext, type PropsWithChildren, useContext } from 'react';
import {
  type ConnectionConfigStore,
  useConnectionConfigStore,
} from './useConnectionConfigStore';

const ConnectionConfigContext = createContext<ConnectionConfigStore | null>(null);

export function ConnectionConfigProvider({ children }: PropsWithChildren) {
  const connectionConfig = useConnectionConfigStore();
  return (
    <ConnectionConfigContext.Provider value={connectionConfig}>
      {children}
    </ConnectionConfigContext.Provider>
  );
}

export function useConnectionConfig() {
  const connectionConfig = useContext(ConnectionConfigContext);
  if (!connectionConfig) {
    throw new Error('Connection config is not available in the current app shell.');
  }

  return connectionConfig;
}
