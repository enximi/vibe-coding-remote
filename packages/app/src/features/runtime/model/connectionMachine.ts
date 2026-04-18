import { resolveAuthCheckEndpoint, resolveHealthcheckEndpoint } from '../../../utils/endpoint';

export type ConnectionStatus =
  | 'checking'
  | 'unconfigured'
  | 'workable'
  | 'connection_error'
  | 'auth_error';

export type ConnectionState = {
  status: ConnectionStatus;
  activeRequestId: number | null;
};

export type ConnectionEvent =
  | { type: 'config_missing' }
  | { type: 'config_invalid' }
  | { type: 'check_requested'; requestId: number }
  | { type: 'check_succeeded'; requestId: number }
  | { type: 'check_auth_failed'; requestId: number }
  | { type: 'check_connection_failed'; requestId: number };

export type ConnectionConfig = {
  authCheckEndpoint: string;
  endpoint: string;
  healthEndpoint: string;
  token: string;
};

export function createInitialConnectionState(endpoint: string, token: string): ConnectionState {
  return {
    status: hasCompleteConfig(endpoint, token) ? 'checking' : 'unconfigured',
    activeRequestId: null,
  };
}

export function connectionReducer(state: ConnectionState, event: ConnectionEvent): ConnectionState {
  switch (event.type) {
    case 'config_missing':
      return {
        status: 'unconfigured',
        activeRequestId: null,
      };
    case 'config_invalid':
      return {
        status: 'connection_error',
        activeRequestId: null,
      };
    case 'check_requested':
      return {
        status: 'checking',
        activeRequestId: event.requestId,
      };
    case 'check_succeeded':
      return resolveCompletedCheckState(state, event.requestId, 'workable');
    case 'check_auth_failed':
      return resolveCompletedCheckState(state, event.requestId, 'auth_error');
    case 'check_connection_failed':
      return resolveCompletedCheckState(state, event.requestId, 'connection_error');
  }
}

export function resolveConnectionConfig(
  rawEndpoint: string,
  rawToken: string,
): ConnectionConfig | 'missing' | 'invalid' {
  const endpoint = rawEndpoint.trim();
  const token = rawToken.trim();
  const healthEndpoint = resolveHealthcheckEndpoint(endpoint);
  const authCheckEndpoint = resolveAuthCheckEndpoint(endpoint);

  if (!endpoint || !token) {
    return 'missing';
  }

  if (!healthEndpoint || !authCheckEndpoint) {
    return 'invalid';
  }

  return {
    authCheckEndpoint,
    endpoint,
    healthEndpoint,
    token,
  };
}

function hasCompleteConfig(endpoint: string, token: string): boolean {
  return endpoint.trim().length > 0 && token.trim().length > 0;
}

function resolveCompletedCheckState(
  state: ConnectionState,
  requestId: number,
  status: ConnectionStatus,
): ConnectionState {
  if (state.activeRequestId !== requestId) {
    return state;
  }

  return {
    status,
    activeRequestId: null,
  };
}
