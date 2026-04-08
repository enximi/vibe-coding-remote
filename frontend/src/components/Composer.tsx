import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { sendToDesktop, pressKey } from '../utils/api';
import { hapticVibrate } from '../utils/haptics';
import type { Preferences } from '../hooks/usePreferences';

interface ComposerProps {
  prefs: Preferences;
  addHistory: (text: string) => void;
  onSendActionStart?: () => void;
  onSendActionEnd?: () => void;
}

export interface ComposerHandle {
  submitText: () => Promise<void>;
  focusInput: () => void;
  setText: (text: string) => void;
}

export const Composer = forwardRef<ComposerHandle, ComposerProps>(({ prefs, addHistory, onSendActionStart, onSendActionEnd }, ref) => {
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
    autoResize();
  }, [text]);

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
      if (inputRef.current) inputRef.current.style.height = 'auto';
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

  const wantsSend = text.length > 0 && prefs.enterBehavior !== 'newline';
  const enterKeyHint = wantsSend ? 'send' : 'enter';

  return (
    <div className="composer-wrapper">
      <textarea
        ref={inputRef}
        id="composerInput"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={() => setIsComposing(false)}
        autoComplete="off"
        autoCorrect="on"
        autoCapitalize="sentences"
        spellCheck="false"
        enterKeyHint={enterKeyHint}
        placeholder=" "
        aria-label="输入要发送到电脑的文字"
        rows={1}
      ></textarea>
      <div className="watermark-placeholder">
        <div className="watermark-header">
          <h1>语音直通电脑</h1>
          <p>开启手机自带键盘语音，文字与指令瞬间送达屏幕。</p>
        </div>
        
        <div className="watermark-details">
          <section>
            <h2>⌨️ 悬浮控制岛 (防键盘收起)</h2>
            <ul>
              <li><strong>复制/粘贴</strong>：发出直通电脑的快捷指令。</li>
              <li><strong>Tab/退格/换行</strong>：<strong>长按可暴力无限连发</strong>。</li>
              <li><strong>发送钮 (右下大圆圈)</strong>：将当前文本段落全部推至电脑。</li>
            </ul>
          </section>

          <section>
            <h2>⚙️ 回车键偏好 (左下角菜单)</h2>
            <ul>
              <li><strong>回车 = 发送</strong>：短句交流神器，敲击键盘原生回车即刻上屏。</li>
              <li><strong>回车 = 换行</strong>：长文沉浸编辑，需手动点击悬浮岛发送钮上屏。</li>
            </ul>
          </section>

          <p className="watermark-note">※ 极客提示：在空行状态下，敲击键盘的原生回车或退格，会直接透传给电脑控制光标。</p>
        </div>
      </div>
    </div>
  );
});
