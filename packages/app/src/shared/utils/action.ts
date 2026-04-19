import type { KeyChord, ServerAction, ServerCode } from '../contracts/server';

export function createInputTextAction(text: string): ServerAction {
  return { type: 'input-text', text };
}

export function createKeyChord(keys: ServerCode[]): KeyChord {
  return { keys };
}

export function createKeySequenceAction(sequence: KeyChord[]): ServerAction {
  return { type: 'key-sequence', sequence };
}

export function createKeyChordAction(keys: ServerCode[]): ServerAction {
  return createKeySequenceAction([createKeyChord(keys)]);
}
