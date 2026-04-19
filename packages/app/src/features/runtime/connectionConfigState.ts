import {
  loadServerAuthToken,
  loadServerEndpoint,
} from './connectionConfigStorage';

export type ConnectionConfigState = {
  serverEndpoint: string;
  serverAuthToken: string;
};

export type ConnectionConfigAction =
  | { type: 'connection_config_saved'; endpoint: string; token: string };

export function createInitialConnectionConfigState(): ConnectionConfigState {
  return {
    serverEndpoint: loadServerEndpoint(),
    serverAuthToken: loadServerAuthToken(),
  };
}

export function connectionConfigReducer(
  _state: ConnectionConfigState,
  action: ConnectionConfigAction,
): ConnectionConfigState {
  switch (action.type) {
    case 'connection_config_saved':
      return {
        serverEndpoint: action.endpoint.trim(),
        serverAuthToken: action.token.trim(),
      };
  }
}
