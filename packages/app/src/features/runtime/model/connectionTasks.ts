import type { ConnectionConfig } from './connectionMachine';

type ConnectionCheckCallbacks = {
  onAuthFailed: () => void;
  onConnectionFailed: () => void;
  onSucceeded: () => void;
};

export async function runConnectionCheck(
  config: ConnectionConfig,
  controller: AbortController,
  callbacks: ConnectionCheckCallbacks,
) {
  try {
    const healthRes = await fetch(config.healthEndpoint, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    }).catch(() => {
      throw new Error('network_error');
    });

    if (!healthRes.ok) {
      throw new Error('network_error');
    }

    const authRes = await fetch(config.authCheckEndpoint, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${config.token}`,
      },
      signal: controller.signal,
    }).catch(() => {
      throw new Error('network_error');
    });

    if (authRes.status === 401 || authRes.status === 403) {
      callbacks.onAuthFailed();
      return;
    }

    if (!authRes.ok) {
      throw new Error('network_error');
    }

    callbacks.onSucceeded();
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return;
    }
    callbacks.onConnectionFailed();
  }
}
