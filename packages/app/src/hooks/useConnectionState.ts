import { useState, useEffect, useCallback, useRef } from 'react';
import {
  resolveAuthCheckEndpoint,
  resolveHealthcheckEndpoint,
} from '@vibe-coding-remote/shared';

export type ConnectionStatus =
  | 'checking'
  | 'unconfigured'
  | 'workable'
  | 'connection_error'
  | 'auth_error';

export function useConnectionState(endpoint: string, token: string) {
  const [status, setStatus] = useState<ConnectionStatus>(() =>
    hasCompleteConfig(endpoint, token) ? 'checking' : 'unconfigured',
  );
  const abortControllerRef = useRef<AbortController | null>(null);

  const checkConnection = useCallback(async (nextEndpoint = endpoint, nextToken = token) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const rawEndpoint = nextEndpoint.trim();
    const cleanToken = nextToken.trim();
    const healthEndpoint = resolveHealthcheckEndpoint(rawEndpoint);
    const authCheckEndpoint = resolveAuthCheckEndpoint(rawEndpoint);

    if (!rawEndpoint || !cleanToken) {
      setStatus('unconfigured');
      return;
    }

    if (!healthEndpoint || !authCheckEndpoint) {
      setStatus('connection_error');
      return;
    }

    setStatus('checking');

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const healthRes = await fetch(healthEndpoint, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
      }).catch(() => {
        throw new Error('network_error');
      });

      if (!healthRes.ok) {
        throw new Error('network_error');
      }

      const authRes = await fetch(authCheckEndpoint, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${cleanToken}`,
        },
        signal: controller.signal,
      }).catch(() => {
        throw new Error('network_error');
      });

      if (authRes.status === 401 || authRes.status === 403) {
        setStatus('auth_error');
        return;
      }

      if (!authRes.ok) {
        throw new Error('network_error');
      }

      setStatus('workable');
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return;
      }
      setStatus('connection_error');
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }, [endpoint, token]);

  useEffect(() => {
    void checkConnection(endpoint, token);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [checkConnection]);

  return { status, checkConnection };
}

function hasCompleteConfig(endpoint: string, token: string): boolean {
  return endpoint.trim().length > 0 && token.trim().length > 0;
}
