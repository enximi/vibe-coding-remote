import { COMPOSER_DRAFT_STORAGE_KEY } from '@vibe-coding-remote/shared';

export function loadComposerDraft(): string {
  try {
    return window.localStorage.getItem(COMPOSER_DRAFT_STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

export function saveComposerDraft(text: string): void {
  try {
    if (text.length === 0) {
      window.localStorage.removeItem(COMPOSER_DRAFT_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(COMPOSER_DRAFT_STORAGE_KEY, text);
  } catch {
    // Ignore storage failures and keep the editor usable.
  }
}

export function clearComposerDraft(): void {
  try {
    window.localStorage.removeItem(COMPOSER_DRAFT_STORAGE_KEY);
  } catch {
    // Ignore storage failures and keep the editor usable.
  }
}
