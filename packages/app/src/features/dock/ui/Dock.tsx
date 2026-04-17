import { useEffect, useMemo, useRef, useState } from 'react';
import { MoreIcon, SendIcon, SettingsIcon } from '../../../ui/icons';
import { usePreferences } from '../../preferences/model/PreferencesContext';
import { useConnection } from '../../runtime/model/ConnectionContext';
import { useDockLayout } from '../model/useDockLayout';
import { DockActionButton } from './DockActionButton';
import { createDockActionConfigs } from './dockActionConfigs';

interface DockProps {
  onVisibleActionCountChange?: (count: number) => void;
  onMenuClick: () => void;
  onSendClick: () => Promise<void>;
  isSendingSuccess: boolean;
  hasText: boolean;
}

export function Dock({
  onVisibleActionCountChange,
  onMenuClick,
  onSendClick,
  isSendingSuccess,
  hasText,
}: DockProps) {
  const { prefs } = usePreferences();
  const { status } = useConnection();
  const [isSending, setIsSending] = useState(false);
  const [isOverflowOpen, setIsOverflowOpen] = useState(false);
  const dockRef = useRef<HTMLElement>(null);

  const actionButtons = useMemo(() => {
    return createDockActionConfigs({
      dockButtonOrder: prefs.dockButtonOrder,
      dockButtons: prefs.dockButtons,
    });
  }, [prefs.dockButtons, prefs.dockButtonOrder]);
  const visibleActionButtons = useMemo(
    () => actionButtons.filter((button) => button.isVisible),
    [actionButtons],
  );
  const hasSendButton = status === 'workable';
  const {
    dockVisibleActionCount,
    measureActionRefs,
    measureDockRef,
    measureFirstDividerRef,
    measureOverflowRef,
    measureSendDividerRef,
    measureSendRef,
    measureSettingsRef,
  } = useDockLayout({
    hasSendButton,
    onVisibleActionCountChange,
    visibleActionCount: visibleActionButtons.length,
  });
  const dockActionButtons = visibleActionButtons.slice(0, dockVisibleActionCount);
  const overflowActionButtons = visibleActionButtons.slice(dockVisibleActionCount);

  useEffect(() => {
    if (!isOverflowOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (!dockRef.current?.contains(target)) {
        setIsOverflowOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown, true);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, [isOverflowOpen]);

  useEffect(() => {
    if (status !== 'workable' || overflowActionButtons.length === 0) {
      setIsOverflowOpen(false);
    }
  }, [overflowActionButtons.length, status]);

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
    <>
      <nav ref={dockRef} className="dock" aria-label="快捷操作">
        <button
          className={`dock-btn ${status !== 'workable' && status !== 'checking' ? 'dock-btn--attention' : ''}`}
          type="button"
          aria-label="设置与历史"
          onClick={onMenuClick}
          onPointerDown={(event) => event.preventDefault()}
        >
          <SettingsIcon width={24} height={24} />
        </button>

        {visibleActionButtons.length > 0 && <div className="dock-divider" />}

        {dockActionButtons.map((button) => (
          <DockActionButton
            key={button.actionKey}
            {...button}
            disabled={status !== 'workable'}
            variant="dock"
            vibrationEnabled={prefs.vibrationEnabled}
          />
        ))}

        {overflowActionButtons.length > 0 && (
          <div className="dock-overflow-anchor">
            <button
              className={[
                'dock-btn',
                isOverflowOpen ? 'dock-btn--active' : '',
                status !== 'workable' ? 'dock-btn--disabled' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              type="button"
              aria-label="更多快捷操作"
              aria-expanded={isOverflowOpen}
              disabled={status !== 'workable'}
              onClick={() => setIsOverflowOpen((current) => !current)}
              onPointerDown={(event) => {
                event.preventDefault();
              }}
            >
              <MoreIcon width={20} height={20} />
            </button>

            {isOverflowOpen && (
              <div className="dock-overflow-popover">
                <div
                  className="dock-overflow-grid"
                  style={{
                    gridTemplateColumns: `repeat(${Math.min(2, overflowActionButtons.length)}, max-content)`,
                  }}
                >
                  {overflowActionButtons.map((button) => (
                    <DockActionButton
                      key={`overflow-${button.actionKey}`}
                      {...button}
                      disabled={status !== 'workable'}
                      variant="popover"
                      vibrationEnabled={prefs.vibrationEnabled}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {hasSendButton && (
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

      <div ref={measureDockRef} className="dock dock--measure" aria-hidden="true">
        <button ref={measureSettingsRef} className="dock-btn" type="button" tabIndex={-1}>
          <SettingsIcon width={24} height={24} />
        </button>
        <div ref={measureFirstDividerRef} className="dock-divider" />
        {visibleActionButtons.map((button, index) => (
          <button
            key={`measure-${button.actionKey}`}
            ref={(element) => {
              measureActionRefs.current[index] = element;
            }}
            className="dock-btn dock-btn--action"
            type="button"
            tabIndex={-1}
          >
            {button.icon}
          </button>
        ))}
        <button ref={measureOverflowRef} className="dock-btn" type="button" tabIndex={-1}>
          <MoreIcon width={20} height={20} />
        </button>
        <div ref={measureSendDividerRef} className="dock-divider" />
        <button
          ref={measureSendRef}
          className="dock-btn dock-btn--primary"
          type="button"
          tabIndex={-1}
        >
          <SendIcon width={20} height={20} />
        </button>
      </div>
    </>
  );
}
