import { useEffect, type MutableRefObject } from 'react';
import { saveComposerDraft } from './draft';

type UseComposerEffectsOptions = {
  focusInput: () => void;
  hasRestoredDraft: boolean;
  isComposing: boolean;
  moveCaretToEnd: () => void;
  onTextChange?: (hasText: boolean) => void;
  syncEnterKeyHint: () => void;
  syncTextareaHeight: () => void;
  text: string;
  textRef: MutableRefObject<string>;
};

export function useComposerEffects({
  focusInput,
  hasRestoredDraft,
  isComposing,
  moveCaretToEnd,
  onTextChange,
  syncEnterKeyHint,
  syncTextareaHeight,
  text,
  textRef,
}: UseComposerEffectsOptions) {
  useEffect(() => {
    syncTextareaHeight();
  }, [syncTextareaHeight, text]);

  useEffect(() => {
    onTextChange?.(text.length > 0);
  }, [onTextChange, text]);

  useEffect(() => {
    saveComposerDraft(text);
  }, [text]);

  useEffect(() => {
    textRef.current = text;
  }, [text, textRef]);

  useEffect(() => {
    if (!isComposing) {
      syncEnterKeyHint();
    }
  }, [isComposing, syncEnterKeyHint, text]);

  useEffect(() => {
    let restoreFocusTimerId = 0;
    let initialFocusTimerId = 0;

    const persistCurrentDraft = () => {
      saveComposerDraft(textRef.current);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        persistCurrentDraft();
        return;
      }

      if (document.visibilityState === 'visible') {
        restoreFocusTimerId = window.setTimeout(focusInput, 60);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', persistCurrentDraft);
    initialFocusTimerId = window.setTimeout(() => {
      focusInput();
      if (hasRestoredDraft) {
        moveCaretToEnd();
      }
    }, 120);

    return () => {
      window.clearTimeout(restoreFocusTimerId);
      window.clearTimeout(initialFocusTimerId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', persistCurrentDraft);
    };
  }, [focusInput, hasRestoredDraft, moveCaretToEnd, textRef]);
}
