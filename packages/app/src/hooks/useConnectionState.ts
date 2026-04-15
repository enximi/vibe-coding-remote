import { useState, useEffect, useCallback, useRef } from 'react';

export type ConnectionStatus =
  | 'checking'
  | 'unconfigured'
  | 'workable'
  | 'connection_error'
  | 'auth_error';

export function useConnectionState(endpoint: string, token: string) {
  const [status, setStatus] = useState<ConnectionStatus>('unconfigured');
  const abortControllerRef = useRef<AbortController | null>(null);

  const checkConnection = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const cleanEndpoint = endpoint.trim().replace(/\/+$/, '');
    const cleanToken = token.trim();

    if (!cleanEndpoint || !cleanToken) {
      setStatus('unconfigured');
      return;
    }

    setStatus('checking');

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const healthRes = await fetch(`${cleanEndpoint}/health`, {
        method: 'GET',
        signal: controller.signal,
      }).catch(() => {
        throw new Error('network_error');
      });

      if (!healthRes.ok) {
        throw new Error('network_error');
      }

      const authRes = await fetch(`${cleanEndpoint}/api/auth-check`, {
        method: 'GET',
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
    void checkConnection();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [checkConnection]);

  return { status, checkConnection };
}
