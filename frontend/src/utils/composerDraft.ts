const DRAFT_STORAGE_KEY = 'voicebridge.mobile.draft';

export function loadComposerDraft(): string {
  try {
    return window.localStorage.getItem(DRAFT_STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

export function saveComposerDraft(text: string): void {
  try {
    if (text.length === 0) {
      window.localStorage.removeItem(DRAFT_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(DRAFT_STORAGE_KEY, text);
  } catch {
    // Ignore storage failures and keep the editor usable.
  }
}

export function clearComposerDraft(): void {
  try {
    window.localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // Ignore storage failures and keep the editor usable.
  }
}
