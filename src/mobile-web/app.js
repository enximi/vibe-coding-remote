const input = document.getElementById('composerInput');
const form = document.getElementById('composerForm');
const actionButtons = document.querySelectorAll('[data-key]');

const ENDPOINT_KEY = 'voicebridge.mobile.endpoint';
const url = new URL(window.location.href);
const presetEndpoint = url.searchParams.get('endpoint');

if (presetEndpoint) {
  localStorage.setItem(ENDPOINT_KEY, presetEndpoint);
}

const typeTextEndpoint = presetEndpoint || localStorage.getItem(ENDPOINT_KEY) || '/api/type-text';
const pressKeyEndpoint = buildSiblingEndpoint(typeTextEndpoint, 'press-key');

function buildSiblingEndpoint(endpoint, siblingName) {
  const resolved = new URL(endpoint, window.location.href);
  resolved.pathname = resolved.pathname.replace(/\/[^/]+$/, `/${siblingName}`);
  resolved.search = '';
  return resolved.toString();
}

function focusInput(select = false) {
  input.focus({ preventScroll: true });
  if (select && input.value) {
    input.select();
  }
}

async function sendToDesktop(text) {
  const response = await fetch(typeTextEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error(`发送失败：${response.status}`);
  }

  return response.json().catch(() => ({ ok: true }));
}

async function pressKey(key) {
  const response = await fetch(pressKeyEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ key }),
  });

  if (!response.ok) {
    throw new Error(`按键失败：${response.status}`);
  }

  return response.json().catch(() => ({ ok: true }));
}

async function submitCurrentText() {
  const text = input.value.trim();
  if (!text) {
    focusInput();
    return;
  }

  try {
    await sendToDesktop(text);
    input.value = '';
    focusInput();
  } catch (error) {
    console.error(error);
    focusInput(true);
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  await submitCurrentText();
});

for (const button of actionButtons) {
  button.addEventListener('click', async () => {
    try {
      await pressKey(button.dataset.key);
      focusInput();
    } catch (error) {
      console.error(error);
      focusInput();
    }
  });
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    setTimeout(() => focusInput(), 60);
  }
});

window.addEventListener('load', () => {
  setTimeout(() => focusInput(), 120);
});
