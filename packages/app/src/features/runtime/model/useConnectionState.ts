import { useCallback, useEffect, useReducer, useRef } from 'react';
import {
  connectionReducer,
  createInitialConnectionState,
  resolveConnectionConfig,
} from './connectionMachine';
import { runConnectionCheck } from './connectionTasks';

export function useConnectionState(endpoint: string, token: string) {
  const [state, dispatch] = useReducer(
    connectionReducer,
    { endpoint, token },
    ({ endpoint: initialEndpoint, token: initialToken }) =>
      createInitialConnectionState(initialEndpoint, initialToken),
  );
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  const recheckConnection = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const resolvedConfig = resolveConnectionConfig(endpoint, token);

    if (resolvedConfig === 'missing') {
      dispatch({ type: 'config_missing' });
      return;
    }

    if (resolvedConfig === 'invalid') {
      dispatch({ type: 'config_invalid' });
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    requestIdRef.current += 1;
    const requestId = requestIdRef.current;
    dispatch({ type: 'check_requested', requestId });

    void runConnectionCheck(resolvedConfig, controller, {
      onAuthFailed: () => dispatch({ type: 'check_auth_failed', requestId }),
      onConnectionFailed: () => dispatch({ type: 'check_connection_failed', requestId }),
      onSucceeded: () => dispatch({ type: 'check_succeeded', requestId }),
    }).finally(() => {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    });
  }, [endpoint, token]);

  useEffect(() => {
    void recheckConnection();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [recheckConnection]);

  return { status: state.status, recheckConnection };
}
