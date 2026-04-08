import React, { useEffect, useRef } from 'react';
import type { Preferences, DockButtons } from '../hooks/usePreferences';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefs: Preferences;
  setPrefs: (update: (p: Preferences) => Preferences) => void;
  clearHistory: () => void;
  onHistorySelect: (text: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, onClose, prefs, setPrefs, clearHistory, onHistorySelect 
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (!dialogRef.current?.open) {
        dialogRef.current?.showModal();
      }
    } else {
      if (dialogRef.current?.open) {
        dialogRef.current?.close();
      }
    }
  }, [isOpen]);

  const toggleDockBtn = (key: keyof DockButtons) => {
    setPrefs(p => ({
      ...p,
      dockButtons: { ...p.dockButtons, [key]: !p.dockButtons[key] }
    }));
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  return (
    <dialog ref={dialogRef} id="menuModal" className="modal" onClick={handleBackdropClick} onClose={onClose}>
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">偏好设置</h2>
          <button className="close-btn" type="button" aria-label="关闭" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="settings-group">
          <h3>界面外观</h3>
          <div className="segmented-control">
            <button type="button" className={prefs.theme === 'system' ? 'active' : ''} onClick={() => setPrefs(p => ({...p, theme: 'system'}))}>系统</button>
            <button type="button" className={prefs.theme === 'light' ? 'active' : ''} onClick={() => setPrefs(p => ({...p, theme: 'light'}))}>浅色</button>
            <button type="button" className={prefs.theme === 'dark' ? 'active' : ''} onClick={() => setPrefs(p => ({...p, theme: 'dark'}))}>深色</button>
          </div>
        </div>

        <div className="settings-group">
          <h3>键盘回车键功能</h3>
          <div className="segmented-control">
            <button type="button" className={prefs.enterBehavior === 'send' ? 'active' : ''} onClick={() => setPrefs(p => ({...p, enterBehavior: 'send'}))}>直接发送</button>
            <button type="button" className={prefs.enterBehavior === 'newline' ? 'active' : ''} onClick={() => setPrefs(p => ({...p, enterBehavior: 'newline'}))}>换行编写</button>
          </div>
        </div>

        <div className="settings-group">
          <h3>悬浮岛按键显示</h3>
          <div className="toggle-list">
            <label className="toggle-item">
              <span>复制 (Ctrl+C)</span>
              <input type="checkbox" checked={prefs.dockButtons.copy !== false} onChange={() => toggleDockBtn('copy')} />
            </label>
            <label className="toggle-item">
              <span>粘贴 (Ctrl+V)</span>
              <input type="checkbox" checked={prefs.dockButtons.paste !== false} onChange={() => toggleDockBtn('paste')} />
            </label>
            <label className="toggle-item">
              <span>Tab 缩进</span>
              <input type="checkbox" checked={prefs.dockButtons.tab !== false} onChange={() => toggleDockBtn('tab')} />
            </label>
            <label className="toggle-item">
              <span>插入换行</span>
              <input type="checkbox" checked={prefs.dockButtons.newline !== false} onChange={() => toggleDockBtn('newline')} />
            </label>
            <label className="toggle-item">
              <span>实体退格</span>
              <input type="checkbox" checked={prefs.dockButtons.backspace !== false} onChange={() => toggleDockBtn('backspace')} />
            </label>
          </div>
        </div>

        <div className="settings-group history-group">
          <div className="history-header">
            <h3>最近发送记录</h3>
            <button className="history-clear-btn" type="button" onClick={clearHistory}>清空全部</button>
          </div>
          <ul className="history-list">
            {prefs.history.length === 0 ? (
              <li className="history-item empty">过去犹如一张白纸</li>
            ) : (
              prefs.history.map((item, idx) => {
                const d = new Date(item.time);
                const isToday = d.toDateString() === new Date().toDateString();
                const timeStr = isToday 
                    ? `今天 ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                
                return (
                  <li key={idx} className="history-item" onClick={() => onHistorySelect(item.text)}>
                    <div className="history-time">{timeStr}</div>
                    <div className="history-text">{item.text}</div>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </div>
    </dialog>
  );
};
