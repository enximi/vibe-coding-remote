import {
  API_ENDPOINT_STORAGE_KEY,
  DEFAULT_WEB_PRESS_KEY_ENDPOINT,
  DEFAULT_WEB_TYPE_TEXT_ENDPOINT,
  type ApiResponse,
  type VoiceBridgeBridge,
  type VibrationPattern,
} from '@voice-bridge/shared';

export function createWebBridge(): VoiceBridgeBridge {
  return {
    sendText(text) {
      return postJson<ApiResponse>(getTypeTextEndpoint(), { text }, 'Sending text failed');
    },
    pressKey(key) {
      return postJson<ApiResponse>(getPressKeyEndpoint(), { key }, 'Triggering key action failed');
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

function getTypeTextEndpoint(): string {
  return (
    getPresetEndpoint() ??
    window.localStorage.getItem(API_ENDPOINT_STORAGE_KEY) ??
    DEFAULT_WEB_TYPE_TEXT_ENDPOINT
  );
}

function getPressKeyEndpoint(): string {
  const typeTextEndpoint = getTypeTextEndpoint();

  try {
    const resolved = new URL(typeTextEndpoint, window.location.href);
    resolved.pathname = resolved.pathname.replace(/\/[^/]+$/, '/press-key');
    resolved.search = '';
    return resolved.toString();
  } catch {
    return DEFAULT_WEB_PRESS_KEY_ENDPOINT;
  }
}

function getPresetEndpoint(): string | null {
  const url = new URL(window.location.href);
  return url.searchParams.get('endpoint');
}

async function postJson<T>(url: string, body: unknown, errorPrefix: string): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`${errorPrefix}: ${response.status}`);
  }

  return response.json().catch(() => ({ ok: true } as T));
}
