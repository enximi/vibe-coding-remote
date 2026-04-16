import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { DockButtons, DockButtonKey, Preferences } from '../hooks/usePreferences';
import { normalizeDockButtonOrder } from '../hooks/usePreferences';
import {
  BackspaceIcon,
  CloseIcon,
  CtrlCIcon,
  CtrlVIcon,
  EnterIcon,
  GripIcon,
  PasteNewlineIcon,
  ShiftTabIcon,
  TabIcon,
  SystemThemeIcon,
  LightThemeIcon,
  DarkThemeIcon,
  SendIcon,
} from './icons';
import { DOCK_ACTION_DEFINITIONS } from './dockActions';

import type { ConnectionStatus } from '../hooks/useConnectionState';

interface SettingsModalProps {
  isOpen: boolean;
  status: ConnectionStatus;
  checkConnection: (endpoint?: string, token?: string) => void;
  onClose: () => void;
  prefs: Preferences;
  setPrefs: (update: (p: Preferences) => Preferences) => void;
  serverEndpoint: string;
  setServerEndpoint: (value: string) => void;
  serverAuthToken: string;
  setServerAuthToken: (value: string) => void;
  clearHistory: () => void;
  removeHistory: (time: number) => void;
  onHistorySelect: (text: string) => void;
  visibleDockActionCount: number | null;
}

export function SettingsModal({
  isOpen,
  status,
  checkConnection,
  onClose,
  prefs,
  setPrefs,
  serverEndpoint,
  setServerEndpoint,
  serverAuthToken,
  setServerAuthToken,
  clearHistory,
  removeHistory,
  onHistorySelect,
  visibleDockActionCount,
}: SettingsModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isClosingRef = useRef(false);
  const touchStartY = useRef(0);
  const scrollStartY = useRef(0);

  const resetCloseAnimation = useCallback(() => {
    if (contentRef.current) {
      contentRef.current.style.transform = '';
    }
    if (dialogRef.current) {
      dialogRef.current.classList.remove('modal-animating');
      dialogRef.current.classList.remove('modal-closing');
      dialogRef.current.style.setProperty('--backdrop-opacity', '1');
    }
  }, []);

  const requestClose = useCallback(() => {
    if (isClosingRef.current) {
      return;
    }
    isClosingRef.current = true;
    if (dialogRef.current?.open) {
      dialogRef.current.close();
    }
    resetCloseAnimation();
    onClose();
  }, [onClose, resetCloseAnimation]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    scrollStartY.current = contentRef.current?.scrollTop || 0;
    if (contentRef.current) {
      contentRef.current.style.transition = 'none';
    }
    if (dialogRef.current) {
      dialogRef.current.classList.remove('modal-animating');
      dialogRef.current.classList.remove('modal-closing');
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!contentRef.current) return;
    const deltaY = e.touches[0].clientY - touchStartY.current;
    
    if (scrollStartY.current <= 0 && deltaY > 0) {
      const resistance = 0.6;
      const translateY = deltaY * resistance;
      contentRef.current.style.transform = `translateY(${translateY}px)`;
      
      if (dialogRef.current) {
        const fadeRatio = Math.max(0, 1 - translateY / 300);
        dialogRef.current.style.setProperty('--backdrop-opacity', fadeRatio.toString());
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!contentRef.current) return;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    
    if (scrollStartY.current <= 0 && deltaY > 100) {
      requestClose();
    } else {
      contentRef.current.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';
      contentRef.current.style.transform = '';
      
      if (dialogRef.current) {
        dialogRef.current.classList.add('modal-animating');
        dialogRef.current.style.setProperty('--backdrop-opacity', '1');
        setTimeout(() => {
          if (dialogRef.current) {
            dialogRef.current.classList.remove('modal-animating');
          }
        }, 300);
      }
    }
  };

  const [endpointDraft, setEndpointDraft] = useState(serverEndpoint);
  const [tokenDraft, setTokenDraft] = useState(serverAuthToken);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const dockActionDefinitions = useMemo(
    () => new Map(DOCK_ACTION_DEFINITIONS.map((definition) => [definition.key, definition])),
    [],
  );

  const iconByKey: Record<DockButtonKey, React.ReactNode> = useMemo(
    () => ({
      enter: <EnterIcon width={18} height={18} />,
      tab: <TabIcon width={18} height={18} />,
      shiftTab: <ShiftTabIcon width={18} height={18} />,
      ctrlC: <CtrlCIcon width={18} height={18} />,
      ctrlV: <CtrlVIcon width={18} height={18} />,
      pasteNewline: <PasteNewlineIcon width={18} height={18} />,
      backspace: <BackspaceIcon width={18} height={18} />,
    }),
    [],
  );

  const orderedDockButtons = normalizeDockButtonOrder(prefs.dockButtonOrder);
  const enabledDockButtons = orderedDockButtons.filter((key) => prefs.dockButtons[key]);
  const pinnedDockButtonCount = visibleDockActionCount ?? enabledDockButtons.length;
  const pinnedDockButtons = new Set(enabledDockButtons.slice(0, pinnedDockButtonCount));

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (isOpen) {
      isClosingRef.current = false;
      if (!dialog.open) {
        dialog.showModal();
      }
      return;
    }

    if (dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    setEndpointDraft(serverEndpoint);
  }, [serverEndpoint]);

  useEffect(() => {
    setTokenDraft(serverAuthToken);
  }, [serverAuthToken]);

  const handleApplyConfig = () => {
    setServerEndpoint(endpointDraft);
    setServerAuthToken(tokenDraft);
    void checkConnection(endpointDraft, tokenDraft);
  };

  const toggleDockButton = (key: keyof DockButtons) => {
    setPrefs((prev) => ({
      ...prev,
      dockButtons: {
        ...prev.dockButtons,
        [key]: !prev.dockButtons[key],
      },
    }));
  };

  const handleDockOrderDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) {
      return;
    }

    setPrefs((prev) => {
      const currentOrder = normalizeDockButtonOrder(prev.dockButtonOrder);
      const oldIndex = currentOrder.indexOf(active.id as DockButtonKey);
      const newIndex = currentOrder.indexOf(over.id as DockButtonKey);

      if (oldIndex === -1 || newIndex === -1) {
        return prev;
      }

      return {
        ...prev,
        dockButtonOrder: arrayMove(currentOrder, oldIndex, newIndex),
      };
    });
  };

  return (
    <dialog
      ref={dialogRef}
      id="menuModal"
      className="modal"
      onPointerDown={(event) => {
        if (event.target === dialogRef.current) {
          event.preventDefault();
          requestClose();
        }
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) {
          requestClose();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
    >
      <div 
        className="modal-content"
        ref={contentRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="modal-header">
          <h2 className="modal-title">偏好设置</h2>
          <button
            className="close-btn"
            type="button"
            aria-label="关闭"
            onPointerDown={(event) => {
              event.preventDefault();
              requestClose();
            }}
            onClick={requestClose}
          >
            <CloseIcon width={24} height={24} />
          </button>
        </div>

        <section className="settings-group connection-group">
          <div className="connection-header">
            <h3>Server 配置</h3>
            {status === 'checking' && <span className="status-badge checking">检查中...</span>}
            {status === 'workable' && <span className="status-badge ok">配置正常</span>}
            {status === 'unconfigured' && <span className="status-badge unconfigured">未配置完整</span>}
            {status === 'connection_error' && <span className="status-badge disconnected-notice">连接失败</span>}
            {status === 'auth_error' && <span className="status-badge disconnected-notice">认证失败</span>}
          </div>
          
          <div className="settings-card">
            <label className="settings-card-row">
              <span className="settings-card-label">地址</span>
              <input
                type="url"
                inputMode="url"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                placeholder="http://192.168.1.23:8765"
                value={endpointDraft}
                onChange={(event) => setEndpointDraft(event.target.value)}
                onBlur={handleApplyConfig}
              />
            </label>
            <div className="settings-card-divider" />
            <label className="settings-card-row">
              <span className="settings-card-label">密钥</span>
              <input
                type="password"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                placeholder="必填的访问密钥"
                value={tokenDraft}
                onChange={(event) => setTokenDraft(event.target.value)}
                onBlur={handleApplyConfig}
              />
            </label>
            <div className="settings-card-divider" />
            <button className="settings-card-btn" type="button" onClick={handleApplyConfig}>
              测试并保存连接
            </button>
          </div>

          {status === 'connection_error' && (
            <p className="settings-error">连接失败，请检查地址或确保服务器已启动。</p>
          )}
          {status === 'unconfigured' && (
            <p className="settings-error">请同时填写 Server 地址和 Token，然后再重试连接。</p>
          )}
          {status === 'auth_error' && (
            <p className="settings-error">认证失败，请检查 Token 是否匹配。</p>
          )}

          <p className="settings-hint">
            填写电脑上 Voice Bridge server 的地址和 Token。留空时默认状态为“未配置”。修改后自动测试连接。
          </p>
        </section>

        <section className="settings-group">
          <h3>界面外观</h3>
          <div className="segmented-control">
            <button
              type="button"
              className={prefs.theme === 'system' ? 'active' : ''}
              onClick={() => setPrefs((prev) => ({ ...prev, theme: 'system' }))}
            >
              <SystemThemeIcon width={16} height={16} /> 系统
            </button>
            <button
              type="button"
              className={prefs.theme === 'light' ? 'active' : ''}
              onClick={() => setPrefs((prev) => ({ ...prev, theme: 'light' }))}
            >
              <LightThemeIcon width={16} height={16} /> 浅色
            </button>
            <button
              type="button"
              className={prefs.theme === 'dark' ? 'active' : ''}
              onClick={() => setPrefs((prev) => ({ ...prev, theme: 'dark' }))}
            >
              <DarkThemeIcon width={16} height={16} /> 深色
            </button>
          </div>
        </section>

        <section className="settings-group">
          <h3>键盘回车键功能</h3>
          <div className="segmented-control">
            <button
              type="button"
              className={prefs.enterBehavior === 'send' ? 'active' : ''}
              onClick={() => setPrefs((prev) => ({ ...prev, enterBehavior: 'send' }))}
            >
              <SendIcon width={16} height={16} /> 直接发送
            </button>
            <button
              type="button"
              className={prefs.enterBehavior === 'newline' ? 'active' : ''}
              onClick={() => setPrefs((prev) => ({ ...prev, enterBehavior: 'newline' }))}
            >
              <EnterIcon width={16} height={16} /> 换行编写
            </button>
          </div>
        </section>

        <section className="settings-group">
          <h3>编辑区字体大小</h3>
          <div className="settings-card">
            <label className="settings-card-row">
              <span className="settings-card-label">字号数值</span>
              <input
                type="number"
                inputMode="numeric"
                min={16}
                max={64}
                value={prefs.fontSize || ''}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setPrefs((prev) => ({ ...prev, fontSize: isNaN(val) ? 0 : val }));
                }}
                onBlur={(e) => {
                  let val = parseInt(e.target.value, 10);
                  if (isNaN(val) || val === 0) val = 24;
                  val = Math.max(16, Math.min(64, val));
                  setPrefs((prev) => ({ ...prev, fontSize: val }));
                }}
                style={{ textAlign: 'right' }}
                aria-label="输入字体大小数值"
              />
              <span style={{ color: 'var(--placeholder)', fontSize: 15 }}>px</span>
            </label>
            <div className="settings-card-divider" />
            <div className="settings-slider-wrapper">
              <span className="settings-slider-label" style={{ fontSize: 14 }}>A</span>
              <input 
                type="range" 
                className="settings-slider"
                min={16} 
                max={64} 
                step={1}
                value={prefs.fontSize}
                onChange={(e) => setPrefs((prev) => ({ ...prev, fontSize: Number(e.target.value) }))}
                aria-label="拖动调整字体大小"
              />
              <span className="settings-slider-label" style={{ fontSize: 24 }}>A</span>
            </div>
          </div>
        </section>

        <section className="settings-group">
          <h3>交互反馈</h3>
          <div className="settings-card">
            <label className="settings-card-row" style={{ cursor: 'pointer' }}>
              <span className="settings-card-label" style={{ flex: 1 }}>按键触感震动</span>
              <button
                type="button"
                role="switch"
                aria-checked={prefs.vibrationEnabled}
                className="settings-switch"
                onClick={(e) => {
                  e.preventDefault();
                  setPrefs((prev) => ({ ...prev, vibrationEnabled: !prev.vibrationEnabled }));
                }}
                aria-label="开启触感震动反馈"
              >
                <span className="settings-switch-thumb" />
              </button>
            </label>
          </div>
        </section>

        <section className="settings-group">
          <h3>快捷动作显示与顺序</h3>
          <p className="settings-hint">
            拖动手柄调整顺序，点击条目切换启用状态。应用会根据当前页面宽度尽量显示更多按钮，显示不下的自动收进“更多”。
          </p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDockOrderDragEnd}>
            <SortableContext items={orderedDockButtons} strategy={verticalListSortingStrategy}>
              <div className="dock-order-list">
                {orderedDockButtons.map((key) => {
                  const definition = dockActionDefinitions.get(key);
                  if (!definition) {
                    return null;
                  }

                  return (
                    <SortableDockButtonItem
                      key={key}
                      buttonKey={key}
                      icon={iconByKey[key]}
                      label={definition.settingsLabel}
                      active={prefs.dockButtons[key]}
                      location={prefs.dockButtons[key] ? (pinnedDockButtons.has(key) ? 'dock' : 'overflow') : 'hidden'}
                      onToggle={() => toggleDockButton(key)}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        </section>

        <section className="settings-group history-group">
          <div className="history-header">
            <h3>最近发送记录</h3>
            <button className="history-clear-btn" type="button" onClick={clearHistory}>
              清空全部
            </button>
          </div>

          <ul className="history-list">
            {prefs.history.length === 0 ? (
              <li className="history-item empty">过去犹如一张白纸</li>
            ) : (
              prefs.history.map((item, index) => (
                <li key={`${item.time}-${index}`} className="history-item">
                  <div className="history-item-content" onClick={() => onHistorySelect(item.text)}>
                    <div className="history-time">{formatHistoryTime(item.time)}</div>
                    <div className="history-text">{item.text}</div>
                  </div>
                  <button
                    className="history-delete-btn"
                    type="button"
                    aria-label="删除此条记录"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeHistory(item.time);
                    }}
                  >
                    <CloseIcon width={16} height={16} />
                  </button>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </dialog>
  );
}

interface SortableDockButtonItemProps {
  buttonKey: DockButtonKey;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  location: 'dock' | 'overflow' | 'hidden';
  onToggle: () => void;
}

function SortableDockButtonItem({
  buttonKey,
  icon,
  label,
  active,
  location,
  onToggle,
}: SortableDockButtonItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: buttonKey });

  return (
    <div
      ref={setNodeRef}
      className={`dock-order-item ${isDragging ? 'dragging' : ''}`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        className="dock-order-handle"
        aria-label={`拖动调整 ${label} 的顺序`}
        {...attributes}
        {...listeners}
      >
        <GripIcon width={18} height={18} />
      </button>

      <div className="dock-order-content" onClick={onToggle} aria-hidden="true">
        <div className="dock-order-icon-wrapper">
          {icon}
        </div>
        <div className="dock-order-text">
          <span className="dock-order-title">{label}</span>
          <span className="dock-order-subtitle">
            {location === 'dock' ? '显示在 Dock' : location === 'overflow' ? '收起在“更多”' : '已隐藏'}
          </span>
        </div>
      </div>

      <div className="dock-order-actions">
        <button
          type="button"
          role="switch"
          aria-checked={active}
          className="settings-switch"
          onClick={onToggle}
          aria-label={`启用 ${label}`}
        >
          <span className="settings-switch-thumb" />
        </button>
      </div>
    </div>
  );
}

function formatHistoryTime(timestamp: number) {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return `今天 ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}
