const ENDPOINT_KEY = 'voicebridge.mobile.endpoint';
const DEFAULT_TYPE_TEXT_ENDPOINT = '/api/type-text';
const DEFAULT_PRESS_KEY_ENDPOINT = '/api/press-key';

type ApiResponse = {
  ok: boolean;
};

export type InputActionKey = 'enter' | 'tab' | 'backspace' | 'copy' | 'paste' | 'newline';

export function getTypeTextEndpoint(): string {
  return getPresetEndpoint() ?? window.localStorage.getItem(ENDPOINT_KEY) ?? DEFAULT_TYPE_TEXT_ENDPOINT;
}

export function getPressKeyEndpoint(): string {
  const typeTextEndpoint = getTypeTextEndpoint();

  try {
    const resolved = new URL(typeTextEndpoint, window.location.href);
    resolved.pathname = resolved.pathname.replace(/\/[^/]+$/, '/press-key');
    resolved.search = '';
    return resolved.toString();
  } catch {
    return DEFAULT_PRESS_KEY_ENDPOINT;
  }
}

export async function sendToDesktop(text: string): Promise<ApiResponse> {
  return postJson<ApiResponse>(getTypeTextEndpoint(), { text }, 'Sending text failed');
}

export async function pressKey(key: InputActionKey): Promise<ApiResponse> {
  return postJson<ApiResponse>(getPressKeyEndpoint(), { key }, 'Triggering key action failed');
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
