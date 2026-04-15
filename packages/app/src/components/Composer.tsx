import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import type { Preferences } from '../hooks/usePreferences';
import { useBridge } from '../features/runtime/BridgeContext';
import type { ConnectionStatus } from '../hooks/useConnectionState';
import {
  clearComposerDraft,
  loadComposerDraft,
  saveComposerDraft,
} from '../features/editor/draft';

interface ComposerProps {
  prefs: Preferences;
  status: ConnectionStatus;
  addHistory: (text: string) => void;
  onTextChange?: (hasText: boolean) => void;
  onSendActionStart?: () => void;
  onSendActionEnd?: () => void;
}

export interface ComposerHandle {
  submitText: () => Promise<void>;
  focusInput: () => void;
  setText: (text: string) => void;
}

export const Composer = forwardRef<ComposerHandle, ComposerProps>(function Composer(
  { prefs, status, addHistory, onTextChange, onSendActionStart, onSendActionEnd },
  ref,
) {
  const bridge = useBridge();
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
    inputRef.current?.focus({ preventScroll: true });
  }, []);

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

  const setComposerText = useCallback(
    (value: string) => {
      textRef.current = value;
      setText(value);
    },
    [],
  );

  const submitCurrentText = useCallback(async () => {
    if (status !== 'workable') {
      return;
    }
    if (text.length === 0) {
      try {
        bridge.vibrate(30);
        await bridge.sendKey('enter');
      } catch (error) {
        console.error(error);
        bridge.vibrate([50, 50, 50]);
      } finally {
        focusInput();
      }
      return;
    }

    try {
      bridge.vibrate([20, 30, 20]);
      onSendActionStart?.();
      await bridge.pasteText(text);
      addHistory(text);
      setComposerText('');
      clearComposerDraft();
      if (inputRef.current) inputRef.current.value = '';
      window.setTimeout(syncTextareaHeight, 0);
      window.setTimeout(syncEnterKeyHint, 0);
      window.setTimeout(focusInput, 50);
    } catch (error) {
      console.error(error);
      bridge.vibrate([50, 50, 50]);
      focusInput();
    } finally {
      onSendActionEnd?.();
    }
  }, [
    addHistory,
    focusInput,
    onSendActionEnd,
    onSendActionStart,
    setComposerText,
    syncEnterKeyHint,
    text,
    bridge,
  ]);

  useImperativeHandle(
    ref,
    () => ({
      submitText: submitCurrentText,
      focusInput,
      setText: (value: string) => {
        setComposerText(value);
        if (inputRef.current) inputRef.current.value = value;
        window.setTimeout(() => {
          syncTextareaHeight();
          syncEnterKeyHint();
          moveCaretToEnd();
        }, 0);
      },
    }),
    [focusInput, moveCaretToEnd, setComposerText, submitCurrentText, syncEnterKeyHint],
  );

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
  }, [text]);

  useEffect(() => {
    if (!isComposing) {
      syncEnterKeyHint();
    }
  }, [isComposing, prefs.enterBehavior, syncEnterKeyHint]);

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

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isComposing) {
      return;
    }

    if (event.key === 'Backspace' && text.length === 0) {
      if (status !== 'workable') {
        return;
      }
      event.preventDefault();
      bridge.vibrate(30);
      void bridge.sendKey('backspace').catch(() => undefined);
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
  };

  return (
    <div className="composer-wrapper">
      <textarea
        ref={inputRef}
        id="composerInput"
        defaultValue={text}
        onChange={(event) => {
          setComposerText(event.target.value);
          window.setTimeout(syncTextareaHeight, 0);
        }}
        onKeyDown={handleKeyDown}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={() => {
          setIsComposing(false);
          syncEnterKeyHint();
        }}
        onKeyUp={() => {
          if (!isComposing) {
            syncEnterKeyHint();
          }
        }}
        autoComplete="off"
        autoCorrect="on"
        autoCapitalize="sentences"
        spellCheck={false}
        placeholder=" "
        aria-label="输入要发送到电脑的文字"
        rows={1}
      />
      <div className={`watermark-placeholder ${text.length > 0 ? 'hidden' : ''}`}>
        {status !== 'workable' && status !== 'checking' && (
          <p className="disconnected-notice">当前服务器处于断开状态。可以继续在这里输入并写草稿，待网络恢复后即可发送。</p>
        )}
        <p>这是一个把手机输入发送到电脑的小工具。</p>
        <p>先在电脑上把光标放到你想输入的位置，然后在这里输入文字，或直接使用手机输入法的语音输入。</p>
        <p>点击发送后，内容会出现在电脑当前光标处。回车可以根据设置用于发送或换行；当输入框为空时，退格会直接作用到电脑。底部按钮也可以帮助你发送换行、退格等常用操作。</p>
      </div>
    </div>
  );
});
