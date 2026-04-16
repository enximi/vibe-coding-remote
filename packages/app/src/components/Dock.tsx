import { useMemo, useState } from 'react';
import type { Preferences } from '../hooks/usePreferences';
import type { ConnectionStatus } from '../hooks/useConnectionState';
import { useContinuousTrigger, type DockAction } from '../hooks/useContinuousTrigger';
import {
  BackspaceIcon,
  CopyIcon,
  EnterIcon,
  NewlineIcon,
  PasteIcon,
  SendIcon,
  SettingsIcon,
  ShiftTabIcon,
  TabIcon,
} from './icons';

type DockActionConfig = {
  actionKey: DockAction;
  ariaLabel: string;
  isContinuous: boolean;
  isVisible: boolean;
  icon: React.ReactNode;
};

interface DockProps {
  prefs: Preferences;
  status?: ConnectionStatus;
  onMenuClick: () => void;
  onSendClick: () => Promise<void>;
  isSendingSuccess: boolean;
  hasText: boolean;
}

export function Dock({
  prefs,
  status,
  onMenuClick,
  onSendClick,
  isSendingSuccess,
  hasText,
}: DockProps) {
  const [isSending, setIsSending] = useState(false);

  const actionButtons = useMemo<DockActionConfig[]>(
    () => [
      {
        actionKey: 'enter',
        ariaLabel: '发送 Enter',
        isContinuous: false,
        isVisible: prefs.dockButtons.enter !== false,
        icon: <EnterIcon width={20} height={20} />,
      },
      {
        actionKey: 'tab',
        ariaLabel: '发送 Tab',
        isContinuous: true,
        isVisible: prefs.dockButtons.tab !== false,
        icon: <TabIcon width={20} height={20} />,
      },
      {
        actionKey: 'shift-tab',
        ariaLabel: '发送 Shift+Tab',
        isContinuous: true,
        isVisible: prefs.dockButtons.shiftTab !== false,
        icon: <ShiftTabIcon width={20} height={20} />,
      },
      {
        actionKey: 'ctrl-c',
        ariaLabel: '发送 Ctrl+C',
        isContinuous: false,
        isVisible: prefs.dockButtons.ctrlC !== false,
        icon: <CopyIcon width={20} height={20} />,
      },
      {
        actionKey: 'ctrl-v',
        ariaLabel: '发送 Ctrl+V',
        isContinuous: false,
        isVisible: prefs.dockButtons.ctrlV !== false,
        icon: <PasteIcon width={20} height={20} />,
      },
      {
        actionKey: 'paste-newline',
        ariaLabel: '粘贴换行',
        isContinuous: true,
        isVisible: prefs.dockButtons.pasteNewline !== false,
        icon: <NewlineIcon width={20} height={20} />,
      },
      {
        actionKey: 'backspace',
        ariaLabel: '发送 Backspace',
        isContinuous: true,
        isVisible: prefs.dockButtons.backspace !== false,
        icon: <BackspaceIcon width={20} height={20} />,
      },
    ],
    [prefs.dockButtons],
  );

  const handleSend = async (
    event: React.PointerEvent<HTMLButtonElement> | React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    if (isSending || !hasText) {
      return;
    }

    setIsSending(true);
    await onSendClick();
    window.setTimeout(() => setIsSending(false), 350);
  };

  return (
    <nav className="dock" aria-label="快捷操作">
      <button
        className={`dock-btn ${status !== 'workable' && status !== 'checking' ? 'dock-btn--attention' : ''}`}
        type="button"
        aria-label="设置与历史"
        onClick={onMenuClick}
        onPointerDown={(event) => event.preventDefault()}
      >
        <SettingsIcon width={24} height={24} />
      </button>

      {actionButtons
        .filter((button) => button.isVisible)
        .map((button) => (
          <DockActionButton key={button.actionKey} {...button} disabled={status !== 'workable'} />
        ))}

      {status === 'workable' && (
        <>
          <div className="dock-divider" />

      <button
        className={[
          'dock-btn',
          'dock-btn--primary',
          isSendingSuccess ? 'dock-btn--sent' : '',
          !hasText ? 'dock-btn--disabled' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        id="sendBtn"
        type="button"
        aria-label="发送"
        aria-disabled={!hasText}
        onPointerDown={(event) => {
          if (hasText) {
            void handleSend(event);
          } else {
            event.preventDefault();
          }
        }}
        onClick={(event) => {
          if (hasText) {
            void handleSend(event);
          } else {
            event.preventDefault();
          }
        }}
          >
            <SendIcon width={20} height={20} />
          </button>
        </>
      )}
    </nav>
  );
}

function DockActionButton({
  actionKey,
  ariaLabel,
  icon,
  isContinuous,
  disabled,
}: DockActionConfig & { disabled?: boolean }) {
  const { triggerCount, ...triggerProps } = useContinuousTrigger(actionKey, isContinuous);

  const mergedProps = disabled ? {} : triggerProps;

  return (
    <button
      className={`dock-btn dock-btn--action ${disabled ? 'dock-btn--disabled' : ''}`}
      type="button"
      aria-label={ariaLabel}
      {...mergedProps}
    >
      {icon}
      <div className={`combo-counter ${triggerCount > 1 ? 'visible' : ''}`}>
        {triggerCount > 1 && <span className="combo-number">x{triggerCount}</span>}
      </div>
    </button>
  );
}
