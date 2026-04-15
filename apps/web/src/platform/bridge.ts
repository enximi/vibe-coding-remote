import {
  DEFAULT_ACTION_API_PATH,
  createPasteTextAction,
  createSendKeyAction,
  createSendShortcutAction,
  resolveConfiguredActionEndpoint,
  resolveConfiguredAuthToken,
  type ApiResponse,
  type ServerAction,
  type ServerKeyName,
  type ServerShortcut,
  type VibrationPattern,
  type VoiceBridgeBridge,
} from '@voice-bridge/shared';

export function createWebBridge(): VoiceBridgeBridge {
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
  return resolveConfiguredActionEndpoint() ?? DEFAULT_ACTION_API_PATH;
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
