import { useEffect, useRef, useState } from 'react';
import type { DockButtons, Preferences } from '../hooks/usePreferences';
import { CloseIcon } from './icons';

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
  onHistorySelect: (text: string) => void;
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
  onHistorySelect,
}: SettingsModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [endpointDraft, setEndpointDraft] = useState(serverEndpoint);
  const [tokenDraft, setTokenDraft] = useState(serverAuthToken);

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

        <section className="settings-group connection-group">
          <div className="connection-header">
            <h3>Server 配置</h3>
            {status === 'checking' && <span className="status-badge checking">检查中...</span>}
            {status === 'workable' && <span className="status-badge ok">配置正常</span>}
            {status === 'unconfigured' && <span className="status-badge unconfigured">未配置完整</span>}
          </div>
          
          <label className="settings-text-field">
            <div className="field-label">Server 地址</div>
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
          {status === 'connection_error' && (
            <p className="settings-error">连接失败，请检查地址或确保服务器已启动。</p>
          )}

          <label className="settings-text-field">
            <div className="field-label">Server Token</div>
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
          {status === 'unconfigured' && (
            <p className="settings-error">请同时填写 Server 地址和 Token，然后再重试连接。</p>
          )}
          {status === 'auth_error' && (
            <p className="settings-error">认证失败，请检查 Token 是否匹配。</p>
          )}

          <p className="settings-hint">
            填写电脑上 Voice Bridge server 的地址和 Token。留空时默认状态为“未配置”。修改后自动测试连接。
          </p>

          <button className="settings-retry-btn" type="button" onClick={handleApplyConfig}>
            重试连接
          </button>
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
          <h3>快捷动作显示</h3>
          <div className="compact-toggles">
            <button type="button" className={prefs.dockButtons.enter ? 'active' : ''} onClick={() => toggleDockButton('enter')}>
              Enter
            </button>
            <button type="button" className={prefs.dockButtons.tab ? 'active' : ''} onClick={() => toggleDockButton('tab')}>
              Tab
            </button>
            <button type="button" className={prefs.dockButtons.shiftTab ? 'active' : ''} onClick={() => toggleDockButton('shiftTab')}>
              Shift+Tab
            </button>
            <button type="button" className={prefs.dockButtons.ctrlC ? 'active' : ''} onClick={() => toggleDockButton('ctrlC')}>
              Ctrl+C
            </button>
            <button type="button" className={prefs.dockButtons.ctrlV ? 'active' : ''} onClick={() => toggleDockButton('ctrlV')}>
              Ctrl+V
            </button>
            <button type="button" className={prefs.dockButtons.pasteNewline ? 'active' : ''} onClick={() => toggleDockButton('pasteNewline')}>
              粘贴换行
            </button>
            <button type="button" className={prefs.dockButtons.backspace ? 'active' : ''} onClick={() => toggleDockButton('backspace')}>
              Backspace
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
