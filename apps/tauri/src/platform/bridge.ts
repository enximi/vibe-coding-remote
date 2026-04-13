import {
  DEFAULT_LOCAL_SERVER_URL,
  type ApiResponse,
  type VoiceBridgeBridge,
  type VibrationPattern,
} from '@voice-bridge/shared';

const TYPE_TEXT_ENDPOINT = `${DEFAULT_LOCAL_SERVER_URL}/api/type-text`;
const PRESS_KEY_ENDPOINT = `${DEFAULT_LOCAL_SERVER_URL}/api/press-key`;

export function createTauriBridge(): VoiceBridgeBridge {
  return {
    sendText(text) {
      return postJson<ApiResponse>(TYPE_TEXT_ENDPOINT, { text }, 'Sending text failed');
    },
    pressKey(key) {
      return postJson<ApiResponse>(PRESS_KEY_ENDPOINT, { key }, 'Triggering key action failed');
    },
    vibrate(_pattern: VibrationPattern = 50) {
      // Desktop Tauri currently uses no haptic feedback.
    },
  };
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
