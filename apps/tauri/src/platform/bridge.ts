import {
  createPasteTextAction,
  createSendKeyAction,
  createSendShortcutAction,
  resolveConfiguredActionEndpoint,
  resolveConfiguredAuthToken,
  type ApiResponse,
  type ServerAction,
  type VibrationPattern,
  type VoiceBridgeBridge,
} from '@voice-bridge/shared';

export function createTauriBridge(): VoiceBridgeBridge {
  return {
    executeAction(action) {
      return postAction(action);
    },
    sendKey(key) {
      return postAction(createSendKeyAction(key));
    },
    sendShortcut(shortcut) {
      return postAction(createSendShortcutAction(shortcut));
    },
    pasteText(text) {
      return postAction(createPasteTextAction(text));
    },
    vibrate(_pattern: VibrationPattern = 50) {
      // Android haptics will be handled later through the native layer if needed.
    },
  };
}

function getRequiredActionEndpoint(): string {
  const endpoint = resolveConfiguredActionEndpoint();
  if (!endpoint) {
    throw new Error(
      'No Voice Bridge server action endpoint is configured. Provide ?endpoint=... or persist one before sending.',
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

  return response.json().catch(() => ({ ok: true } as ApiResponse));
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
