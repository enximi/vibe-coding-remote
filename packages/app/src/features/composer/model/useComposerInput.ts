import {
  type ChangeEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { usePreferences } from '../../preferences/model/PreferencesContext';
import { useBridge } from '../../runtime/model/BridgeContext';
import { useConnection } from '../../runtime/model/ConnectionContext';
import { clearComposerDraft, loadComposerDraft, saveComposerDraft } from './draft';

type NavigatorWithVirtualKeyboard = Navigator & {
  virtualKeyboard?: {
    show?: () => void;
  };
};

type UseComposerInputOptions = {
  onTextChange?: (hasText: boolean) => void;
  onSendActionStart?: () => void;
  onSendActionEnd?: () => void;
};

export function useComposerInput({
  onTextChange,
  onSendActionStart,
  onSendActionEnd,
}: UseComposerInputOptions) {
  const bridge = useBridge();
  const { prefs, addHistory } = usePreferences();
  const { status } = useConnection();
  const [text, setText] = useState(loadComposerDraft);
  const [isComposing, setIsComposing] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const textRef = useRef(text);
  const hasRestoredDraftRef = useRef(text.length > 0);

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

    const wantsSend = input.value.length > 0 && prefs.enterBehavior !== 'newline';
    const nextHint = wantsSend ? 'send' : 'enter';
    if (input.getAttribute('enterkeyhint') !== nextHint) {
      input.setAttribute('enterkeyhint', nextHint);
    }
  }, [prefs.enterBehavior]);

  const setComposerText = useCallback((value: string) => {
    textRef.current = value;
    setText(value);
  }, []);

  const syncTextareaAfterValueChange = useCallback(() => {
    window.setTimeout(() => {
      syncTextareaHeight();
      syncEnterKeyHint();
      moveCaretToEnd();
    }, 0);
  }, [moveCaretToEnd, syncEnterKeyHint, syncTextareaHeight]);

  const setInputText = useCallback(
    (value: string) => {
      setComposerText(value);
      if (inputRef.current) {
        inputRef.current.value = value;
      }
      syncTextareaAfterValueChange();
    },
    [setComposerText, syncTextareaAfterValueChange],
  );

  const submitCurrentText = useCallback(async () => {
    if (status !== 'workable') {
      return;
    }

    if (text.length === 0) {
      try {
        if (prefs.vibrationEnabled) {
          bridge.vibrate(30);
        }
        await bridge.sendKeyChord(['Enter']);
      } catch (error) {
        console.error(error);
        if (prefs.vibrationEnabled) {
          bridge.vibrate([50, 50, 50]);
        }
      } finally {
        focusInput();
      }
      return;
    }

    try {
      if (prefs.vibrationEnabled) {
        bridge.vibrate([20, 30, 20]);
      }
      onSendActionStart?.();
      await bridge.inputText(text);
      addHistory(text);
      setComposerText('');
      clearComposerDraft();
      if (inputRef.current) {
        inputRef.current.value = '';
      }
      window.setTimeout(syncTextareaHeight, 0);
      window.setTimeout(syncEnterKeyHint, 0);
      window.setTimeout(focusInput, 50);
    } catch (error) {
      console.error(error);
      if (prefs.vibrationEnabled) {
        bridge.vibrate([50, 50, 50]);
      }
      focusInput();
    } finally {
      onSendActionEnd?.();
    }
  }, [
    addHistory,
    bridge,
    focusInput,
    onSendActionEnd,
    onSendActionStart,
    prefs.vibrationEnabled,
    setComposerText,
    syncEnterKeyHint,
    syncTextareaHeight,
    status,
    text,
  ]);

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
  }, [text]);

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
      if (hasRestoredDraftRef.current) {
        moveCaretToEnd();
      }
    }, 120);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', persistCurrentDraft);
    };
  }, [focusInput, moveCaretToEnd]);

  const handleTextChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      setComposerText(event.target.value);
      window.setTimeout(syncTextareaHeight, 0);
    },
    [setComposerText, syncTextareaHeight],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (isComposing) {
        return;
      }

      if (event.key === 'Backspace' && text.length === 0) {
        if (status !== 'workable') {
          return;
        }
        event.preventDefault();
        if (prefs.vibrationEnabled) {
          bridge.vibrate(30);
        }
        void bridge.sendKeyChord(['Backspace']).catch(() => undefined);
        return;
      }

      if (event.key === 'Enter' && !event.shiftKey) {
        if (prefs.enterBehavior === 'newline' && text.length > 0) {
          return;
        }

        if (status !== 'workable') {
          return;
        }

        event.preventDefault();
        void submitCurrentText();
      }
    },
    [
      bridge,
      isComposing,
      prefs.enterBehavior,
      prefs.vibrationEnabled,
      status,
      submitCurrentText,
      text.length,
    ],
  );

  const handleCompositionStart = useCallback(() => {
    setIsComposing(true);
  }, []);

  const handleCompositionEnd = useCallback(() => {
    setIsComposing(false);
    syncEnterKeyHint();
  }, [syncEnterKeyHint]);

  const handleKeyUp = useCallback(() => {
    if (!isComposing) {
      syncEnterKeyHint();
    }
  }, [isComposing, syncEnterKeyHint]);

  return {
    fontSize: prefs.fontSize,
    focusInput,
    handleCompositionEnd,
    handleCompositionStart,
    handleKeyDown,
    handleKeyUp,
    handleTextChange,
    inputRef,
    setInputText,
    status,
    submitCurrentText,
    text,
  };
}
