const input = document.getElementById('composerInput');
const form = document.getElementById('composerForm');
const actionButtons = document.querySelectorAll('[data-key]');
const sendBtn = document.getElementById('sendBtn');

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

function autoResizeInput() {
  input.style.height = 'auto';
  input.style.height = input.scrollHeight + 'px';

  const wantsSend = input.value.length > 0;
  const currentHint = input.getAttribute('enterkeyhint');
  const targetHint = wantsSend ? 'send' : 'enter';
  if (currentHint !== targetHint) {
    input.setAttribute('enterkeyhint', targetHint);
  }
}

input.addEventListener('input', autoResizeInput);
input.addEventListener('keydown', (e) => {
  if (e.key === 'Backspace' && input.value === '') {
    e.preventDefault();
    hapticVibrate(30);
    pressKey('backspace');
  } else if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    submitCurrentText();
  }
});

// Haptic feedback
function hapticVibrate(pattern = 50) {
  if (navigator.vibrate) {
    try { navigator.vibrate(pattern); } catch (e) {}
  }
}

// Micro-animation trigger for the floating dock action
function triggerSuccessAnimation(btn) {
  if (!btn) return;
  btn.classList.add('dock-btn--sent');
  setTimeout(() => {
    btn.classList.remove('dock-btn--sent');
  }, 400);
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
    throw new Error(`Sending failed：${response.status}`);
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
    throw new Error(`Keypress failed：${response.status}`);
  }

  return response.json().catch(() => ({ ok: true }));
}

async function submitCurrentText() {
  const text = input.value;
  if (text.length === 0) {
    try {
      hapticVibrate(30);
      await pressKey('enter');
      focusInput();
    } catch (error) {
      console.error(error);
      hapticVibrate([50, 50, 50]);
      focusInput();
    }
    return;
  }

  try {
    hapticVibrate([20, 30, 20]); // Affirmative haptic feedback
    triggerSuccessAnimation(sendBtn);
    await sendToDesktop(text);
    input.value = '';
    autoResizeInput();
    focusInput();
  } catch (error) {
    console.error(error);
    hapticVibrate([50, 50, 50]); // Error haptic feedback buzz
    focusInput(true);
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  await submitCurrentText();
});

sendBtn.addEventListener('pointerdown', async (e) => {
  e.preventDefault(); // Prevents input from losing focus so keyboard won't dismiss
  await submitCurrentText();
});

for (const button of actionButtons) {
  button.addEventListener('pointerdown', async (e) => {
    e.preventDefault(); // Prevents input from losing focus
    try {
      hapticVibrate(30); // Light haptic tap
      const key = button.dataset.key;
      await pressKey(key);
    } catch (error) {
      console.error(error);
      hapticVibrate([50, 50, 50]);
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

// To maximize immersion, tap anywhere outside the dock will auto-focus the composer
document.addEventListener('click', (e) => {
  const isDock = e.target.closest('.dock');
  if (!isDock && e.target !== input) {
    focusInput();
  }
});

window.addEventListener('load', () => {
  autoResizeInput();
  if (window.visualViewport) {
    updateKeyboardOffset();
  }
});

// Visual Viewport Sync for Keyboard popping up (iOS/Android)
function updateKeyboardOffset() {
  if (!window.visualViewport) return;
  const vp = window.visualViewport;
  const gap = window.innerHeight - (vp.height + vp.offsetTop);
  document.documentElement.style.setProperty('--keyboard-offset', `${Math.max(0, gap)}px`);
}

if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', updateKeyboardOffset);
  window.visualViewport.addEventListener('scroll', updateKeyboardOffset);
}
