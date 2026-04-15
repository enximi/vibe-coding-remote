import type { ServerAction, ServerKeyName, ServerShortcut } from '../types/server';

export function createSendKeyAction(key: ServerKeyName): ServerAction {
  return { type: 'send-key', key };
}

export function createSendShortcutAction(shortcut: ServerShortcut): ServerAction {
  return { type: 'send-shortcut', shortcut };
}

export function createPasteTextAction(text: string): ServerAction {
  return { type: 'paste-text', text };
}
