import { loadComposerDraft } from './draft';

export type ComposerState = {
  isComposing: boolean;
  text: string;
};

export type ComposerAction =
  | { type: 'composition_started' }
  | { type: 'composition_ended' }
  | { type: 'text_changed'; text: string };

export function createInitialComposerState(): ComposerState {
  return {
    isComposing: false,
    text: loadComposerDraft(),
  };
}

export function composerReducer(state: ComposerState, action: ComposerAction): ComposerState {
  switch (action.type) {
    case 'composition_started':
      return {
        ...state,
        isComposing: true,
      };
    case 'composition_ended':
      return {
        ...state,
        isComposing: false,
      };
    case 'text_changed':
      return {
        ...state,
        text: action.text,
      };
  }
}
