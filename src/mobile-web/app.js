const input = document.getElementById('composerInput');
const form = document.getElementById('composerForm');

const ENDPOINT_KEY = 'voicebridge.mobile.endpoint';
const url = new URL(window.location.href);
const presetEndpoint = url.searchParams.get('endpoint');

if (presetEndpoint) {
  localStorage.setItem(ENDPOINT_KEY, presetEndpoint);
}

const endpoint = presetEndpoint || localStorage.getItem(ENDPOINT_KEY) || '/api/type-text';

function focusInput(select = false) {
  input.focus({ preventScroll: true });
  if (select && input.value) {
    input.select();
  }
}

async function sendToDesktop(text) {
  if (!endpoint) {
    await new Promise((resolve) => setTimeout(resolve, 120));
    return { simulated: true };
  }

  const response = await fetch(endpoint, {
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

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    setTimeout(() => focusInput(), 60);
  }
});

window.addEventListener('load', () => {
  setTimeout(() => focusInput(), 120);
});
