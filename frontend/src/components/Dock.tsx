import React, { useState } from 'react';
import { useContinuousTrigger } from '../hooks/useContinuousTrigger';
import type { Preferences } from '../hooks/usePreferences';

interface DockProps {
  prefs: Preferences;
  onMenuClick: () => void;
  onSendClick: () => Promise<void>;
  isSendingSuccess: boolean;
  hasText: boolean;
}

export const Dock: React.FC<DockProps> = ({ prefs, onMenuClick, onSendClick, isSendingSuccess, hasText }) => {
  const [isSending, setIsSending] = useState(false);

  const handleSend = async (e: React.PointerEvent<HTMLButtonElement> | React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (isSending) return;
    setIsSending(true);
    await onSendClick();
    setTimeout(() => setIsSending(false), 350);
  };

  return (
    <nav className="dock" aria-label="快捷操作">
      <button className="dock-btn" type="button" aria-label="设置与历史" onClick={onMenuClick} onPointerDown={(e) => e.preventDefault()}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      </button>

      {prefs.dockButtons.copy !== false && <DockActionBtn actionKey="copy" isContinuous={false} icon={
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
      } ariaLabel="复制" />}
      
      {prefs.dockButtons.paste !== false && <DockActionBtn actionKey="paste" isContinuous={false} icon={
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
      } ariaLabel="粘贴" />}

      {prefs.dockButtons.tab !== false && <DockActionBtn actionKey="tab" isContinuous={true} icon={
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="12" x2="3" y2="12"></line><polyline points="12 5 21 12 12 19"></polyline><line x1="3" y1="5" x2="3" y2="19"></line></svg>
      } ariaLabel="Tab缩进" />}

      {prefs.dockButtons.newline !== false && <DockActionBtn actionKey="newline" isContinuous={true} icon={
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 10 4 15 9 20"></polyline><path d="M20 4v7a4 4 0 0 1-4 4H4"></path></svg>
      } ariaLabel="换行" />}

      {prefs.dockButtons.backspace !== false && <DockActionBtn actionKey="backspace" isContinuous={true} icon={
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path><line x1="18" y1="9" x2="12" y2="15"></line><line x1="12" y1="9" x2="18" y2="15"></line></svg>
      } ariaLabel="退格" />}

      <div className="dock-divider"></div>

      <button 
        className={`dock-btn dock-btn--primary ${isSendingSuccess ? 'dock-btn--sent' : ''}`} 
        id="sendBtn" 
        type="button" 
        aria-label="发送" 
        onPointerDown={(e) => {
          e.preventDefault();
          if (hasText) handleSend(e);
        }} 
        onClick={(e) => {
          e.preventDefault();
          if (hasText) handleSend(e);
        }}
        aria-disabled={!hasText}
        style={{ opacity: hasText ? 1 : 0.4, cursor: hasText ? 'pointer' : 'not-allowed' }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="19" x2="12" y2="5"></line>
          <polyline points="5 12 12 5 19 12"></polyline>
        </svg>
      </button>
    </nav>
  );
};

interface DockActionBtnProps {
  actionKey: string;
  isContinuous: boolean;
  icon: React.ReactNode;
  ariaLabel: string;
}

const DockActionBtn: React.FC<DockActionBtnProps> = ({ actionKey, isContinuous, icon, ariaLabel }) => {
  const triggerProps = useContinuousTrigger(actionKey, isContinuous);
  
  return (
    <button className="dock-btn" type="button" aria-label={ariaLabel} {...triggerProps}>
      {icon}
    </button>
  );
};
