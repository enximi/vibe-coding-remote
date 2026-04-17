import {
  type ApiResponse,
  createInputTextAction,
  createKeyChordAction,
  createKeySequenceAction,
  type KeyChord,
  resolveConfiguredActionEndpoint,
  resolveConfiguredCapabilitiesEndpoint,
  resolveConfiguredAuthToken,
  type ServerAction,
  type ServerCapabilitiesResponse,
  type ServerCode,
  type VibeCodingRemoteBridge,
  type VibrationPattern,
} from '@vibe-coding-remote/app';

export function createWebBridge(): VibeCodingRemoteBridge {
  return {
    getServerCapabilities() {
      return fetchServerCapabilities();
    },
    executeAction(action) {
      return postAction(action);
    },
    inputText(text) {
      return postAction(createInputTextAction(text));
    },
    sendKeySequence(sequence: KeyChord[]) {
      return postAction(createKeySequenceAction(sequence));
    },
    sendKeyChord(keys: ServerCode[]) {
      return postAction(createKeyChordAction(keys));
    },
    vibrate(pattern: VibrationPattern = 50) {
      if (!navigator.vibrate) {
        return;
      }

      try {
        navigator.vibrate(pattern);
      } catch {
        // Ignore unsupported vibration errors on some mobile browsers.
      }
    },
  };
}

function getRequiredServerEndpoint(
  resolveEndpoint: () => string | null,
  label: 'action' | 'capabilities',
): string {
  const endpoint = resolveEndpoint();
  if (!endpoint) {
    throw new Error(
      `No Vibe Coding Remote server ${label} endpoint is configured. Provide a valid server address before sending.`,
    );
  }

  return endpoint;
}

async function fetchServerCapabilities(): Promise<ServerCapabilitiesResponse> {
  const response = await fetch(
    getRequiredServerEndpoint(resolveConfiguredCapabilitiesEndpoint, 'capabilities'),
    {
      method: 'GET',
      cache: 'no-store',
      headers: buildHeaders(),
    },
  );

  if (!response.ok) {
    throw new Error(`Fetching server capabilities failed: ${response.status}`);
  }

  return response.json();
}

async function postAction(action: ServerAction): Promise<ApiResponse> {
  const response = await fetch(getRequiredServerEndpoint(resolveConfiguredActionEndpoint, 'action'), {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({ action }),
  });

  if (!response.ok) {
    throw new Error(`Executing action failed: ${response.status}`);
  }

  return response.json().catch(() => ({ ok: true }) as ApiResponse);
}

function buildHeaders(): HeadersInit {
  const authToken = resolveConfiguredAuthToken();
  return authToken
    ? {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      }
    : {
        'Content-Type': 'application/json',
      };
}
