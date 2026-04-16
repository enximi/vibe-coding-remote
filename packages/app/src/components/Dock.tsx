import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Preferences } from '../hooks/usePreferences';
import type { ConnectionStatus } from '../hooks/useConnectionState';
import { useContinuousTrigger, type DockAction } from '../hooks/useContinuousTrigger';
import { DOCK_ACTION_DEFINITIONS } from './dockActions';
import {
  BackspaceIcon,
  CtrlCIcon,
  CtrlVIcon,
  EnterIcon,
  MoreIcon,
  PasteNewlineIcon,
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
  onVisibleActionCountChange?: (count: number) => void;
  onMenuClick: () => void;
  onSendClick: () => Promise<void>;
  isSendingSuccess: boolean;
  hasText: boolean;
}

export function Dock({
  prefs,
  status,
  onVisibleActionCountChange,
  onMenuClick,
  onSendClick,
  isSendingSuccess,
  hasText,
}: DockProps) {
  const [isSending, setIsSending] = useState(false);
  const [isOverflowOpen, setIsOverflowOpen] = useState(false);
  const [dockVisibleActionCount, setDockVisibleActionCount] = useState(0);
  const dockRef = useRef<HTMLElement>(null);
  const measureDockRef = useRef<HTMLDivElement>(null);
  const measureSettingsRef = useRef<HTMLButtonElement>(null);
  const measureFirstDividerRef = useRef<HTMLDivElement>(null);
  const measureOverflowRef = useRef<HTMLButtonElement>(null);
  const measureSendDividerRef = useRef<HTMLDivElement>(null);
  const measureSendRef = useRef<HTMLButtonElement>(null);
  const measureActionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const actionButtons = useMemo<DockActionConfig[]>(
    () => {
      const iconByKey: Record<keyof Preferences['dockButtons'], React.ReactNode> = {
        enter: <EnterIcon width={20} height={20} />,
        tab: <TabIcon width={20} height={20} />,
        shiftTab: <ShiftTabIcon width={20} height={20} />,
        ctrlC: <CtrlCIcon width={20} height={20} />,
        ctrlV: <CtrlVIcon width={20} height={20} />,
        pasteNewline: <PasteNewlineIcon width={20} height={20} />,
        backspace: <BackspaceIcon width={20} height={20} />,
      };
      const definitionByKey = new Map(DOCK_ACTION_DEFINITIONS.map((definition) => [definition.key, definition]));

      return prefs.dockButtonOrder
        .map((key) => {
          const definition = definitionByKey.get(key);
          if (!definition) {
            return null;
          }

          return {
            actionKey: definition.actionKey,
            ariaLabel: definition.ariaLabel,
            isContinuous: definition.isContinuous,
            isVisible: prefs.dockButtons[key] !== false,
            icon: iconByKey[key],
          };
        })
        .filter((button): button is DockActionConfig => button !== null);
    },
    [prefs.dockButtons, prefs.dockButtonOrder],
  );
  const visibleActionButtons = actionButtons.filter((button) => button.isVisible);
  const dockActionButtons = visibleActionButtons.slice(0, dockVisibleActionCount);
  const overflowActionButtons = visibleActionButtons.slice(dockVisibleActionCount);
  const hasSendButton = status === 'workable';

  const measureDockVisibleActionCount = useCallback(() => {
    const measureDock = measureDockRef.current;
    const settingsButton = measureSettingsRef.current;
    const firstDivider = measureFirstDividerRef.current;

    if (!measureDock || !settingsButton || !firstDivider) {
      return;
    }

    const availableWidth = getAvailableContentWidth(measureDock);
    const gap = getGapWidth(measureDock);
    const settingsWidth = getOuterWidth(settingsButton);
    const firstDividerWidth = visibleActionButtons.length > 0 ? getOuterWidth(firstDivider) : 0;
    const actionWidths = visibleActionButtons.map((_, index) => getOuterWidth(measureActionRefs.current[index]));
    const overflowWidth = getOuterWidth(measureOverflowRef.current);
    const sendDividerWidth = hasSendButton ? getOuterWidth(measureSendDividerRef.current) : 0;
    const sendWidth = hasSendButton ? getOuterWidth(measureSendRef.current) : 0;

    let nextVisibleCount = 0;

    for (let actionCount = visibleActionButtons.length; actionCount >= 0; actionCount -= 1) {
      const hasVisibleActions = actionCount > 0;
      const hasOverflowButton = visibleActionButtons.length > actionCount;
      const childCount =
        1 +
        (visibleActionButtons.length > 0 ? 1 : 0) +
        actionCount +
        (hasOverflowButton ? 1 : 0) +
        (hasSendButton ? 2 : 0);
      const contentWidth =
        settingsWidth +
        firstDividerWidth +
        actionWidths.slice(0, actionCount).reduce((total, width) => total + width, 0) +
        (hasOverflowButton ? overflowWidth : 0) +
        (hasSendButton ? sendDividerWidth + sendWidth : 0) +
        Math.max(0, childCount - 1) * gap;

      if (contentWidth <= availableWidth || (!hasVisibleActions && !hasOverflowButton)) {
        nextVisibleCount = actionCount;
        break;
      }
    }

    setDockVisibleActionCount((currentCount) => (currentCount === nextVisibleCount ? currentCount : nextVisibleCount));
  }, [hasSendButton, visibleActionButtons]);

  useLayoutEffect(() => {
    setDockVisibleActionCount(visibleActionButtons.length);
  }, [visibleActionButtons.length, hasSendButton]);

  useLayoutEffect(() => {
    measureDockVisibleActionCount();

    const measureDock = measureDockRef.current;
    if (!measureDock || typeof ResizeObserver === 'undefined') {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      measureDockVisibleActionCount();
    });

    resizeObserver.observe(measureDock);

    return () => {
      resizeObserver.disconnect();
    };
  }, [measureDockVisibleActionCount]);

  useEffect(() => {
    onVisibleActionCountChange?.(dockVisibleActionCount);
  }, [dockVisibleActionCount, onVisibleActionCountChange]);

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
          <DockActionButton key={button.actionKey} {...button} disabled={status !== 'workable'} variant="dock" />
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
              <div className="dock-overflow-popover" role="group" aria-label="更多快捷操作">
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
        <button ref={measureSendRef} className="dock-btn dock-btn--primary" type="button" tabIndex={-1}>
          <SendIcon width={20} height={20} />
        </button>
      </div>
    </>
  );
}

function DockActionButton({
  actionKey,
  ariaLabel,
  icon,
  isContinuous,
  disabled,
  variant,
}: DockActionConfig & { disabled?: boolean; variant: 'dock' | 'popover' }) {
  const { triggerCount, ...triggerProps } = useContinuousTrigger(actionKey, isContinuous);

  const mergedProps = disabled ? {} : triggerProps;

  return (
    <button
      className={[
        'dock-btn',
        'dock-btn--action',
        variant === 'popover' ? 'dock-btn--popover' : '',
        disabled ? 'dock-btn--disabled' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      {...mergedProps}
    >
      {icon}
      <div className={`combo-counter ${variant === 'popover' ? 'combo-counter--popover' : ''} ${triggerCount > 1 ? 'visible' : ''}`}>
        {triggerCount > 1 && <span className="combo-number">x{triggerCount}</span>}
      </div>
    </button>
  );
}

function getAvailableContentWidth(element: HTMLElement) {
  const style = window.getComputedStyle(element);
  const paddingLeft = Number.parseFloat(style.paddingLeft) || 0;
  const paddingRight = Number.parseFloat(style.paddingRight) || 0;

  return element.clientWidth - paddingLeft - paddingRight;
}

function getGapWidth(element: HTMLElement) {
  const style = window.getComputedStyle(element);
  return Number.parseFloat(style.columnGap || style.gap) || 0;
}

function getOuterWidth(element: HTMLElement | null) {
  if (!element) {
    return 0;
  }

  const style = window.getComputedStyle(element);
  const marginLeft = Number.parseFloat(style.marginLeft) || 0;
  const marginRight = Number.parseFloat(style.marginRight) || 0;

  return element.getBoundingClientRect().width + marginLeft + marginRight;
}
