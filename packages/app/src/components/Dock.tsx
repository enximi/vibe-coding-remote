import { useMemo, useState } from 'react';
import type { Preferences } from '../hooks/usePreferences';
import type { ConnectionStatus } from '../hooks/useConnectionState';
import { useContinuousTrigger, type DockAction } from '../hooks/useContinuousTrigger';
import {
  BackspaceIcon,
  CopyIcon,
  NewlineIcon,
  PasteIcon,
  SendIcon,
  SettingsIcon,
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
        actionKey: 'copy',
        ariaLabel: '复制',
        isContinuous: false,
        isVisible: prefs.dockButtons.copy !== false,
        icon: <CopyIcon width={20} height={20} />,
      },
      {
        actionKey: 'paste',
        ariaLabel: '粘贴',
        isContinuous: false,
        isVisible: prefs.dockButtons.paste !== false,
        icon: <PasteIcon width={20} height={20} />,
      },
      {
        actionKey: 'tab',
        ariaLabel: 'Tab 缩进',
        isContinuous: true,
        isVisible: prefs.dockButtons.tab !== false,
        icon: <TabIcon width={20} height={20} />,
      },
      {
        actionKey: 'newline',
        ariaLabel: '换行',
        isContinuous: true,
        isVisible: prefs.dockButtons.newline !== false,
        icon: <NewlineIcon width={20} height={20} />,
      },
      {
        actionKey: 'backspace',
        ariaLabel: '退格',
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
