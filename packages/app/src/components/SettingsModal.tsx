import { useEffect, useRef, useState } from 'react';
import type { DockButtons, Preferences } from '../hooks/usePreferences';
import { CloseIcon } from './icons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefs: Preferences;
  setPrefs: (update: (p: Preferences) => Preferences) => void;
  serverEndpoint: string;
  setServerEndpoint: (value: string) => void;
  clearHistory: () => void;
  onHistorySelect: (text: string) => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  prefs,
  setPrefs,
  serverEndpoint,
  setServerEndpoint,
  clearHistory,
  onHistorySelect,
}: SettingsModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [endpointDraft, setEndpointDraft] = useState(serverEndpoint);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (isOpen) {
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

  const toggleDockButton = (key: keyof DockButtons) => {
    setPrefs((prev) => ({
      ...prev,
      dockButtons: {
        ...prev.dockButtons,
        [key]: !prev.dockButtons[key],
      },
    }));
  };

  return (
    <dialog
      ref={dialogRef}
      id="menuModal"
      className="modal"
      onClick={(event) => {
        if (event.target === dialogRef.current) {
          onClose();
        }
      }}
      onClose={onClose}
    >
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">偏好设置</h2>
          <button className="close-btn" type="button" aria-label="关闭" onClick={onClose}>
            <CloseIcon width={24} height={24} />
          </button>
        </div>

        <section className="settings-group">
          <h3>Server 地址</h3>
          <label className="settings-text-field">
            <input
              type="url"
              inputMode="url"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              placeholder="http://192.168.1.23:8765"
              value={endpointDraft}
              onChange={(event) => {
                const nextValue = event.target.value;
                setEndpointDraft(nextValue);
                setServerEndpoint(nextValue);
              }}
            />
          </label>
          <p className="settings-hint">
            填写电脑上 Voice Bridge server 的地址或完整 action 接口地址。留空时，Web 壳会继续使用同源
            <code>/api/action</code>。
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
              系统
            </button>
            <button
              type="button"
              className={prefs.theme === 'light' ? 'active' : ''}
              onClick={() => setPrefs((prev) => ({ ...prev, theme: 'light' }))}
            >
              浅色
            </button>
            <button
              type="button"
              className={prefs.theme === 'dark' ? 'active' : ''}
              onClick={() => setPrefs((prev) => ({ ...prev, theme: 'dark' }))}
            >
              深色
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
              直接发送
            </button>
            <button
              type="button"
              className={prefs.enterBehavior === 'newline' ? 'active' : ''}
              onClick={() => setPrefs((prev) => ({ ...prev, enterBehavior: 'newline' }))}
            >
              换行编写
            </button>
          </div>
        </section>

        <section className="settings-group">
          <h3>悬浮岛按键显示</h3>
          <div className="compact-toggles">
            <button type="button" className={prefs.dockButtons.copy ? 'active' : ''} onClick={() => toggleDockButton('copy')}>
              复制
            </button>
            <button type="button" className={prefs.dockButtons.paste ? 'active' : ''} onClick={() => toggleDockButton('paste')}>
              粘贴
            </button>
            <button type="button" className={prefs.dockButtons.tab ? 'active' : ''} onClick={() => toggleDockButton('tab')}>
              Tab 缩进
            </button>
            <button type="button" className={prefs.dockButtons.newline ? 'active' : ''} onClick={() => toggleDockButton('newline')}>
              插入换行
            </button>
            <button type="button" className={prefs.dockButtons.backspace ? 'active' : ''} onClick={() => toggleDockButton('backspace')}>
              实体退格
            </button>
          </div>
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
                <li key={`${item.time}-${index}`} className="history-item" onClick={() => onHistorySelect(item.text)}>
                  <div className="history-time">{formatHistoryTime(item.time)}</div>
                  <div className="history-text">{item.text}</div>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </dialog>
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
