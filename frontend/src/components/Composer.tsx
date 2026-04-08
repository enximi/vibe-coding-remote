import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { sendToDesktop, pressKey } from '../utils/api';
import { hapticVibrate } from '../utils/haptics';
import type { Preferences } from '../hooks/usePreferences';

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

export const Composer = forwardRef<ComposerHandle, ComposerProps>(({ prefs, addHistory, onTextChange, onSendActionStart, onSendActionEnd }, ref) => {
  const [text, setText] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const focusInput = () => {
    inputRef.current?.focus({ preventScroll: true });
  };

  useImperativeHandle(ref, () => ({
    submitText: async () => {
      await submitCurrentText();
    },
    focusInput,
    setText: (t: string) => {
      setText(t);
      onTextChange?.(t.length > 0);
      if (inputRef.current) inputRef.current.value = t;
      setTimeout(autoResize, 0);
    }
  }));

  const autoResize = () => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
    }
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setTimeout(focusInput, 60);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    setTimeout(focusInput, 120);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const submitCurrentText = async () => {
    if (text.length === 0) {
      try {
        hapticVibrate(30);
        await pressKey('enter');
        focusInput();
      } catch (error) {
        console.error(error);
        hapticVibrate([50, 50, 50]);
        focusInput();
      }
      return;
    }

    try {
      hapticVibrate([20, 30, 20]);
      onSendActionStart?.();
      await sendToDesktop(text);
      addHistory(text);
      setText('');
      onTextChange?.(false);
      if (inputRef.current) {
        inputRef.current.value = '';
        inputRef.current.style.height = 'auto';
      }
      updateEnterKeyHint();
      setTimeout(focusInput, 50);
    } catch (error) {
      console.error(error);
      hapticVibrate([50, 50, 50]);
      focusInput();
    } finally {
      onSendActionEnd?.();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isComposing) return;
    
    if (e.key === 'Backspace' && text === '') {
      e.preventDefault();
      hapticVibrate(30);
      pressKey('backspace');
    } else if (e.key === 'Enter' && !e.shiftKey) {
      if (prefs.enterBehavior === 'newline' && text !== '') {
        return;
      }
      e.preventDefault();
      submitCurrentText();
    }
  };

  const updateEnterKeyHint = () => {
    if (!inputRef.current) return;
    const val = inputRef.current.value;
    const wantsSend = val.length > 0 && prefs.enterBehavior !== 'newline';
    const targetHint = wantsSend ? 'send' : 'enter';
    if (inputRef.current.getAttribute('enterkeyhint') !== targetHint) {
      inputRef.current.setAttribute('enterkeyhint', targetHint);
    }
  };

  const handleKeyUp = () => {
    if (!isComposing) {
      updateEnterKeyHint();
    }
  };

  const handleCompositionEnd = () => {
    setIsComposing(false);
    updateEnterKeyHint();
  };

  return (
    <div className="composer-wrapper">
      <textarea
        ref={inputRef}
        id="composerInput"
        defaultValue=""
        onChange={(e) => {
          const val = e.target.value;
          setText(val);
          onTextChange?.(val.length > 0);
          autoResize();
        }}
        onKeyDown={handleKeyDown}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={handleCompositionEnd}
        onKeyUp={handleKeyUp}
        autoComplete="off"
        autoCorrect="on"
        autoCapitalize="sentences"
        spellCheck="false"
        placeholder=" "
        aria-label="输入要发送到电脑的文字"
        rows={1}
      ></textarea>
    </div>
  );
});
