import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMemo } from 'react';
import {
  BackspaceIcon,
  CloseIcon,
  CtrlCIcon,
  CtrlVIcon,
  DarkThemeIcon,
  EnterIcon,
  GripIcon,
  LightThemeIcon,
  PasteNewlineIcon,
  ScanIcon,
  SendIcon,
  ShiftTabIcon,
  SystemThemeIcon,
  TabIcon,
} from '../../../ui/icons';
import { DOCK_ACTION_DEFINITIONS } from '../../dock/model/dockActions';
import {
  type DockButtonKey,
  type DockButtons,
  normalizeDockButtonOrder,
  type Preferences,
} from '../../preferences/model/preferences';
import type { SetPreferences } from '../../preferences/model/usePreferences';
import type { ConnectionStatus } from '../../runtime/model/useConnectionState';
import { formatHistoryTime } from '../model/historyTime';

export function ConnectionSettingsSection({
  status,
  endpointDraft,
  tokenDraft,
  onEndpointDraftChange,
  onTokenDraftChange,
  onApply,
  onOpenScanner,
}: {
  status: ConnectionStatus;
  endpointDraft: string;
  tokenDraft: string;
  onEndpointDraftChange: (value: string) => void;
  onTokenDraftChange: (value: string) => void;
  onApply: () => void;
  onOpenScanner: () => void;
}) {
  return (
    <section className="settings-group connection-group">
      <div className="connection-header">
        <h3>Server 配置</h3>
        {status === 'checking' && <span className="status-badge checking">检查中...</span>}
        {status === 'workable' && <span className="status-badge ok">配置正常</span>}
        {status === 'unconfigured' && <span className="status-badge unconfigured">未配置完整</span>}
        {status === 'connection_error' && (
          <span className="status-badge disconnected-notice">连接失败</span>
        )}
        {status === 'auth_error' && (
          <span className="status-badge disconnected-notice">认证失败</span>
        )}
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
            onChange={(event) => onEndpointDraftChange(event.target.value)}
            onBlur={onApply}
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
            onChange={(event) => onTokenDraftChange(event.target.value)}
            onBlur={onApply}
          />
        </label>
        <div className="settings-card-divider" />
        <button className="settings-card-btn" type="button" onClick={onApply}>
          测试并保存连接
        </button>
        <div className="settings-card-divider" />
        <button className="settings-card-btn" type="button" onClick={onOpenScanner}>
          <ScanIcon width={18} height={18} /> 扫码导入配置
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
        填写电脑上 Vibe Coding Remote server 的地址和
        Token。留空时默认状态为“未配置”。修改后自动测试连接。
      </p>
    </section>
  );
}

export function AppearanceSettingsSection({
  prefs,
  setPrefs,
}: {
  prefs: Preferences;
  setPrefs: SetPreferences;
}) {
  return (
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
  );
}

export function EnterBehaviorSettingsSection({
  prefs,
  setPrefs,
}: {
  prefs: Preferences;
  setPrefs: SetPreferences;
}) {
  return (
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
  );
}

export function FontSizeSettingsSection({
  prefs,
  setPrefs,
}: {
  prefs: Preferences;
  setPrefs: SetPreferences;
}) {
  return (
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
            onChange={(event) => {
              const value = parseInt(event.target.value, 10);
              setPrefs((prev) => ({
                ...prev,
                fontSize: Number.isNaN(value) ? 0 : value,
              }));
            }}
            onBlur={(event) => {
              let value = parseInt(event.target.value, 10);
              if (Number.isNaN(value) || value === 0) {
                value = 24;
              }
              value = Math.max(16, Math.min(64, value));
              setPrefs((prev) => ({ ...prev, fontSize: value }));
            }}
            style={{ textAlign: 'right' }}
            aria-label="输入字体大小数值"
          />
          <span style={{ color: 'var(--placeholder)', fontSize: 15 }}>px</span>
        </label>
        <div className="settings-card-divider" />
        <div className="settings-slider-wrapper">
          <span className="settings-slider-label" style={{ fontSize: 14 }}>
            A
          </span>
          <input
            type="range"
            className="settings-slider"
            min={16}
            max={64}
            step={1}
            value={prefs.fontSize}
            onChange={(event) =>
              setPrefs((prev) => ({ ...prev, fontSize: Number(event.target.value) }))
            }
            aria-label="拖动调整字体大小"
          />
          <span className="settings-slider-label" style={{ fontSize: 24 }}>
            A
          </span>
        </div>
      </div>
    </section>
  );
}

export function FeedbackSettingsSection({
  prefs,
  setPrefs,
}: {
  prefs: Preferences;
  setPrefs: SetPreferences;
}) {
  return (
    <section className="settings-group">
      <h3>交互反馈</h3>
      <div className="settings-card">
        <label className="settings-card-row" style={{ cursor: 'pointer' }}>
          <span className="settings-card-label" style={{ flex: 1 }}>
            按键触感震动
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={prefs.vibrationEnabled}
            className="settings-switch"
            onClick={(event) => {
              event.preventDefault();
              setPrefs((prev) => ({ ...prev, vibrationEnabled: !prev.vibrationEnabled }));
            }}
            aria-label="开启触感震动反馈"
          >
            <span className="settings-switch-thumb" />
          </button>
        </label>
      </div>
    </section>
  );
}

export function DockSettingsSection({
  prefs,
  setPrefs,
  visibleDockActionCount,
}: {
  prefs: Preferences;
  setPrefs: SetPreferences;
  visibleDockActionCount: number | null;
}) {
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
    <section className="settings-group">
      <h3>快捷动作显示与顺序</h3>
      <p className="settings-hint">
        拖动手柄调整顺序，点击条目切换启用状态。应用会根据当前页面宽度尽量显示更多按钮，显示不下的自动收进“更多”。
      </p>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDockOrderDragEnd}
      >
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
                  location={
                    prefs.dockButtons[key]
                      ? pinnedDockButtons.has(key)
                        ? 'dock'
                        : 'overflow'
                      : 'hidden'
                  }
                  onToggle={() => toggleDockButton(key)}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </section>
  );
}

export function HistorySettingsSection({
  history,
  onClear,
  onRemove,
  onSelect,
}: {
  history: Preferences['history'];
  onClear: () => void;
  onRemove: (time: number) => void;
  onSelect: (text: string) => void;
}) {
  return (
    <section className="settings-group history-group">
      <div className="history-header">
        <h3>最近发送记录</h3>
        <button className="history-clear-btn" type="button" onClick={onClear}>
          清空全部
        </button>
      </div>

      <ul className="history-list">
        {history.length === 0 ? (
          <li className="history-item empty">过去犹如一张白纸</li>
        ) : (
          history.map((item) => (
            <li key={item.time} className="history-item">
              <button
                className="history-item-content"
                type="button"
                onClick={() => onSelect(item.text)}
              >
                <div className="history-time">{formatHistoryTime(item.time)}</div>
                <div className="history-text">{item.text}</div>
              </button>
              <button
                className="history-delete-btn"
                type="button"
                aria-label="删除此条记录"
                onClick={(event) => {
                  event.stopPropagation();
                  onRemove(item.time);
                }}
              >
                <CloseIcon width={16} height={16} />
              </button>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}

function SortableDockButtonItem({
  buttonKey,
  icon,
  label,
  active,
  location,
  onToggle,
}: {
  buttonKey: DockButtonKey;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  location: 'dock' | 'overflow' | 'hidden';
  onToggle: () => void;
}) {
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

      <button className="dock-order-content" type="button" onClick={onToggle}>
        <div className="dock-order-icon-wrapper">{icon}</div>
        <div className="dock-order-text">
          <span className="dock-order-title">{label}</span>
          <span className="dock-order-subtitle">
            {location === 'dock'
              ? '显示在 Dock'
              : location === 'overflow'
                ? '收起在“更多”'
                : '已隐藏'}
          </span>
        </div>
      </button>

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
