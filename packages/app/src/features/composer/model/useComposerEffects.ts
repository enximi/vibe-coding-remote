import { useEffect, type MutableRefObject, type RefObject } from 'react';
import { saveComposerDraft } from './draft';

type UseComposerEffectsOptions = {
  focusInput: () => void;
  hasRestoredDraft: boolean;
  inputRef: RefObject<HTMLTextAreaElement | null>;
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
  inputRef,
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
  }, [syncTextareaHeight]);

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
  }, [isComposing, syncEnterKeyHint]);

  useEffect(() => {
    const persistCurrentDraft = () => {
      const currentValue = inputRef.current?.value ?? textRef.current;
      saveComposerDraft(currentValue);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        persistCurrentDraft();
        return;
      }

      if (document.visibilityState === 'visible') {
        window.setTimeout(focusInput, 60);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', persistCurrentDraft);
    window.setTimeout(() => {
      focusInput();
      if (hasRestoredDraft) {
        moveCaretToEnd();
      }
    }, 120);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', persistCurrentDraft);
    };
  }, [focusInput, hasRestoredDraft, inputRef, moveCaretToEnd, textRef]);
}
