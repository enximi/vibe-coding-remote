import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import type { Preferences } from '../hooks/usePreferences';
import { hapticVibrate } from '../utils/haptics';
import { pressKey, sendToDesktop } from '../utils/api';

interface ComposerProps {
  prefs: Preferences;
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
  { prefs, addHistory, onTextChange, onSendActionStart, onSendActionEnd },
  ref,
) {
  const [text, setText] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
      setText(value);
      onTextChange?.(value.length > 0);
    },
    [onTextChange],
  );

  const submitCurrentText = useCallback(async () => {
    if (text.length === 0) {
      try {
        hapticVibrate(30);
        await pressKey('enter');
      } catch (error) {
        console.error(error);
        hapticVibrate([50, 50, 50]);
      } finally {
        focusInput();
      }
      return;
    }

    try {
      hapticVibrate([20, 30, 20]);
      onSendActionStart?.();
      await sendToDesktop(text);
      addHistory(text);
      setComposerText('');
      if (inputRef.current) inputRef.current.value = '';
      window.setTimeout(syncTextareaHeight, 0);
      window.setTimeout(syncEnterKeyHint, 0);
      window.setTimeout(focusInput, 50);
    } catch (error) {
      console.error(error);
      hapticVibrate([50, 50, 50]);
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
  ]);

  useImperativeHandle(
    ref,
    () => ({
      submitText: submitCurrentText,
      focusInput,
      setText: (value: string) => {
        setComposerText(value);
        if (inputRef.current) inputRef.current.value = value;
        window.setTimeout(syncTextareaHeight, 0);
        window.setTimeout(syncEnterKeyHint, 0);
      },
    }),
    [focusInput, setComposerText, submitCurrentText, syncEnterKeyHint],
  );

  useEffect(() => {
    syncTextareaHeight();
  }, [syncTextareaHeight, text]);

  useEffect(() => {
    if (!isComposing) {
      syncEnterKeyHint();
    }
  }, [isComposing, prefs.enterBehavior, syncEnterKeyHint]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        window.setTimeout(focusInput, 60);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.setTimeout(focusInput, 120);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [focusInput]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isComposing) {
      return;
    }

    if (event.key === 'Backspace' && text.length === 0) {
      event.preventDefault();
      hapticVibrate(30);
      void pressKey('backspace').catch(() => undefined);
      return;
    }

    if (event.key === 'Enter' && !event.shiftKey) {
      if (prefs.enterBehavior === 'newline' && text.length > 0) {
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
        defaultValue=""
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
        <p>这是一个把手机输入发送到电脑的小工具。</p>
        <p>先在电脑上把光标放到你想输入的位置，然后在这里输入文字，或直接使用手机输入法的语音输入。</p>
        <p>点击发送后，内容会出现在电脑当前光标处。回车可以根据设置用于发送或换行；当输入框为空时，退格会直接作用到电脑。底部按钮也可以帮助你发送换行、退格等常用操作。</p>
      </div>
    </div>
  );
});
