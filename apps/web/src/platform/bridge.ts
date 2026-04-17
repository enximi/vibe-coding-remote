import {
  type ApiResponse,
  createInputTextAction,
  createKeyChordAction,
  createKeySequenceAction,
  type KeyChord,
  resolveConfiguredActionEndpoint,
  resolveConfiguredAuthToken,
  type ServerAction,
  type ServerCode,
  type VibeCodingRemoteBridge,
  type VibrationPattern,
} from '@vibe-coding-remote/shared';

export function createWebBridge(): VibeCodingRemoteBridge {
  return {
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

function getRequiredActionEndpoint(): string {
  const endpoint = resolveConfiguredActionEndpoint();
  if (!endpoint) {
    throw new Error(
      'No Vibe Coding Remote server action endpoint is configured. Provide a valid server address before sending.',
    );
  }

  return endpoint;
}

async function postAction(action: ServerAction): Promise<ApiResponse> {
  const response = await fetch(getRequiredActionEndpoint(), {
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
