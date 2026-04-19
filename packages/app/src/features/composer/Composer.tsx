import { forwardRef, useImperativeHandle } from 'react';
import { useComposerController } from './useComposerController';

interface ComposerProps {
  onTextChange?: (hasText: boolean) => void;
  onSendActionStart?: () => void;
  onSendActionComplete?: (success: boolean) => void;
}

export interface ComposerHandle {
  submitText: () => Promise<void>;
  focusInput: () => void;
  setText: (text: string) => void;
}

export const Composer = forwardRef<ComposerHandle, ComposerProps>(function Composer(
  { onTextChange, onSendActionStart, onSendActionComplete },
  ref,
) {
  const composerController = useComposerController({
    onSendActionComplete,
    onSendActionStart,
    onTextChange,
  });

  useImperativeHandle(
    ref,
    () => ({
      submitText: composerController.submitCurrentText,
      focusInput: composerController.focusInput,
      setText: composerController.setInputText,
    }),
    [
      composerController.focusInput,
      composerController.setInputText,
      composerController.submitCurrentText,
    ],
  );

  return (
    <div className="composer-wrapper">
      <textarea
        ref={composerController.inputRef}
        id="composerInput"
        style={{ fontSize: `${composerController.fontSize}px` }}
        value={composerController.text}
        onChange={composerController.handleTextChange}
        onKeyDown={composerController.handleKeyDown}
        onCompositionStart={composerController.handleCompositionStart}
        onCompositionEnd={composerController.handleCompositionEnd}
        autoComplete="off"
        autoCorrect="on"
        autoCapitalize="sentences"
        spellCheck={false}
        placeholder=" "
        aria-label="输入要发送到电脑的文字"
        rows={1}
      />
      <div
        className={`watermark-placeholder ${composerController.text.length > 0 ? 'hidden' : ''}`}
      >
        {composerController.status !== 'workable' &&
          composerController.status !== 'checking' && (
          <p className="disconnected-notice">
            当前服务器处于断开状态。可以继续在这里输入并写草稿，待网络恢复后即可发送。
          </p>
          )}
        <p>这是一个把手机输入发送到电脑的小工具。</p>
        <p>
          先在电脑上把光标放到你想输入的位置，然后在这里输入文字，或直接使用手机输入法的语音输入。
        </p>
        <p>
          点击发送后，内容会出现在电脑当前光标处。回车可以根据设置用于发送或换行；当输入框为空时，退格会直接作用到电脑。底部按钮也可以帮助你发送换行、退格等常用操作。
        </p>
      </div>
    </div>
  );
});
