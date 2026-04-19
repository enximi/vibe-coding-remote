import { useCallback, useReducer, useRef } from 'react';
import { usePreferences } from '../../preferences/model/PreferencesContext';
import { useBridge } from '../../runtime/model/BridgeContext';
import { useConnection } from '../../runtime/model/ConnectionContext';
import { composerReducer, createInitialComposerState } from './composerState';
import { useComposerCommands } from './useComposerCommands';
import { useComposerEffects } from './useComposerEffects';

type NavigatorWithVirtualKeyboard = Navigator & {
  virtualKeyboard?: {
    show?: () => void;
  };
};

type UseComposerInputOptions = {
  onTextChange?: (hasText: boolean) => void;
  onSendActionStart?: () => void;
  onSendActionComplete?: (success: boolean) => void;
};

export function useComposerInput({
  onTextChange,
  onSendActionStart,
  onSendActionComplete,
}: UseComposerInputOptions) {
  const bridge = useBridge();
  const { prefs, addHistory } = usePreferences();
  const { status } = useConnection();
  const [state, dispatch] = useReducer(composerReducer, undefined, createInitialComposerState);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const textRef = useRef(state.text);
  const hasRestoredDraftRef = useRef(state.text.length > 0);

  const moveCaretToEnd = useCallback(() => {
    const input = inputRef.current;
    if (!input) {
      return;
    }

    const end = input.value.length;
    input.setSelectionRange(end, end);
  }, []);

  const focusInput = useCallback(() => {
    const input = inputRef.current;
    if (!input) {
      return;
    }

    const focusAndShowKeyboard = () => {
      input.focus({ preventScroll: true });
      moveCaretToEnd();

      try {
        (navigator as NavigatorWithVirtualKeyboard).virtualKeyboard?.show?.();
      } catch {
        // Some WebViews expose the API but reject calls outside accepted focus windows.
      }
    };

    focusAndShowKeyboard();
    window.requestAnimationFrame(focusAndShowKeyboard);
  }, [moveCaretToEnd]);

  const syncTextareaHeight = useCallback(() => {
    const input = inputRef.current;
    if (!input) {
      return;
    }

    input.style.height = 'auto';
    input.style.height = `${input.scrollHeight}px`;
  }, []);

  const syncEnterKeyHint = useCallback(() => {
    const input = inputRef.current;
    if (!input) {
      return;
    }

    const wantsSend = state.text.length > 0 && prefs.enterBehavior !== 'newline';
    const nextHint = wantsSend ? 'send' : 'enter';
    if (input.getAttribute('enterkeyhint') !== nextHint) {
      input.setAttribute('enterkeyhint', nextHint);
    }
  }, [prefs.enterBehavior, state.text]);

  const setComposerText = useCallback((value: string) => {
    dispatch({ type: 'text_changed', text: value });
  }, []);

  useComposerEffects({
    focusInput,
    hasRestoredDraft: hasRestoredDraftRef.current,
    isComposing: state.isComposing,
    moveCaretToEnd,
    onTextChange,
    syncEnterKeyHint,
    syncTextareaHeight,
    text: state.text,
    textRef,
  });

  const {
    handleKeyDown,
    handleTextChange,
    setInputText,
    submitCurrentText,
  } = useComposerCommands({
    addHistory,
    bridge,
    enterBehavior: prefs.enterBehavior,
    focusInput,
    isComposing: state.isComposing,
    moveCaretToEnd,
    onSendActionComplete,
    onSendActionStart,
    setComposerText,
    status,
    text: state.text,
    vibrationEnabled: prefs.vibrationEnabled,
  });

  const handleCompositionStart = useCallback(() => {
    dispatch({ type: 'composition_started' });
  }, []);

  const handleCompositionEnd = useCallback(() => {
    dispatch({ type: 'composition_ended' });
    syncEnterKeyHint();
  }, [syncEnterKeyHint]);

  return {
    fontSize: prefs.fontSize,
    focusInput,
    handleCompositionEnd,
    handleCompositionStart,
    handleKeyDown,
    handleTextChange,
    inputRef,
    setInputText,
    status,
    submitCurrentText,
    text: state.text,
  };
}
