import { useEffect, useReducer } from 'react';
import {
  saveServerAuthToken,
  saveServerEndpoint,
} from './connectionConfig';
import {
  connectionConfigReducer,
  createInitialConnectionConfigState,
  type ConnectionConfigAction,
} from './connectionConfigState';

export type ConnectionConfigStore = ReturnType<typeof useConnectionConfigStore>;

export function useConnectionConfigStore() {
  const [state, dispatch] = useReducer(
    connectionConfigReducer,
    undefined,
    createInitialConnectionConfigState,
  );
  const { serverEndpoint, serverAuthToken } = state;

  useEffect(() => {
    saveServerEndpoint(serverEndpoint);
  }, [serverEndpoint]);

  useEffect(() => {
    saveServerAuthToken(serverAuthToken);
  }, [serverAuthToken]);

  const send = (action: ConnectionConfigAction) => {
    dispatch(action);
  };

  return {
    serverEndpoint,
    serverAuthToken,
    setConnectionConfig: (endpoint: string, token: string) =>
      send({ type: 'connection_config_saved', endpoint, token }),
  };
}
