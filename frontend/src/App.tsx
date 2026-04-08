import React, { useRef, useState } from 'react';
import { usePreferences } from './hooks/usePreferences';
import { useViewportOffset } from './hooks/useViewportOffset';
import { Composer } from './components/Composer';
import type { ComposerHandle } from './components/Composer';
import { Dock } from './components/Dock';
import { SettingsModal } from './components/SettingsModal';

function App() {
  const { prefs, setPrefs, addHistory, clearHistory } = usePreferences();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSendingSuccess, setIsSendingSuccess] = useState(false);
  const composerRef = useRef<ComposerHandle>(null);
  
  // Applies native iOS visualViewport logic to --keyboard-offset var
  useViewportOffset();

  const handleGlobalClick = (e: React.MouseEvent) => {
    // To maximize immersion, tap anywhere outside the dock will auto-focus the composer
    // This replicates the old Vanilla JS behavior
    const target = e.target as HTMLElement;
    const isDock = target.closest('.dock');
    const isModal = target.closest('.modal');
    const isInput = target.closest('#composerInput');
    
    if (!isDock && !isModal && !isInput) {
      composerRef.current?.focusInput();
    }
  };

  const handleHistorySelect = (text: string) => {
    composerRef.current?.setText(text);
    setIsModalOpen(false);
    setTimeout(() => {
      composerRef.current?.focusInput();
    }, 150);
  };

  const handleSendClick = async () => {
    await composerRef.current?.submitText();
  };

  return (
    <div className="app-container" onClick={handleGlobalClick} style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <form id="composerForm" onSubmit={e => { e.preventDefault(); handleSendClick(); }} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Composer 
          ref={composerRef} 
          prefs={prefs} 
          addHistory={addHistory}
          onSendActionStart={() => setIsSendingSuccess(true)}
          onSendActionEnd={() => setTimeout(() => setIsSendingSuccess(false), 400)}
        />
        <button className="submit-proxy" type="submit" aria-hidden="true" tabIndex={-1}>发送</button>
      </form>
      
      <Dock 
        prefs={prefs} 
        onMenuClick={() => setIsModalOpen(true)} 
        onSendClick={handleSendClick}
        isSendingSuccess={isSendingSuccess}
      />

      <SettingsModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        prefs={prefs}
        setPrefs={setPrefs}
        clearHistory={clearHistory}
        onHistorySelect={handleHistorySelect}
      />
    </div>
  );
}

export default App;
