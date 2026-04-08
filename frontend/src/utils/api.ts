const ENDPOINT_KEY = 'voicebridge.mobile.endpoint';

export function getPresetEndpoint(): string | null {
  const url = new URL(window.location.href);
  return url.searchParams.get('endpoint');
}

export function savePresetEndpoint(endpoint: string) {
  localStorage.setItem(ENDPOINT_KEY, endpoint);
}

export function getTypeTextEndpoint(): string {
  const preset = getPresetEndpoint();
  return preset || localStorage.getItem(ENDPOINT_KEY) || '/api/type-text';
}

export function getPressKeyEndpoint(): string {
  const typeEndpoint = getTypeTextEndpoint();
  try {
    const resolved = new URL(typeEndpoint, window.location.href);
    resolved.pathname = resolved.pathname.replace(/\/[^/]+$/, `/press-key`);
    resolved.search = '';
    return resolved.toString();
  } catch {
    return '/api/press-key';
  }
}

export async function sendToDesktop(text: string): Promise<any> {
  const response = await fetch(getTypeTextEndpoint(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) {
    throw new Error(`Sending failed：${response.status}`);
  }
  return response.json().catch(() => ({ ok: true }));
}

export async function pressKey(key: string): Promise<any> {
  const response = await fetch(getPressKeyEndpoint(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key }),
  });
  if (!response.ok) {
    throw new Error(`Keypress failed：${response.status}`);
  }
  return response.json().catch(() => ({ ok: true }));
}
