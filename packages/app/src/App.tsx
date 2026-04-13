import { useCallback, useRef, useState } from 'react';
import { Composer, type ComposerHandle } from './components/Composer';
import { Dock } from './components/Dock';
import { SettingsModal } from './components/SettingsModal';
import { usePreferences } from './hooks/usePreferences';
import { useViewportOffset } from './hooks/useViewportOffset';

function App() {
  const { prefs, setPrefs, addHistory, clearHistory } = usePreferences();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSendingSuccess, setIsSendingSuccess] = useState(false);
  const [hasText, setHasText] = useState(false);
  const composerRef = useRef<ComposerHandle>(null);

  useViewportOffset();

  const focusComposer = useCallback(() => {
    composerRef.current?.focusInput();
  }, []);

  const handleGlobalClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement;
      const isInteractiveOverlay =
        target.closest('.dock') ||
        target.closest('.modal') ||
        target.closest('#composerInput');

      if (!isInteractiveOverlay) {
        focusComposer();
      }
    },
    [focusComposer],
  );

  const handleHistorySelect = useCallback(
    (text: string) => {
      composerRef.current?.setText(text);
      setIsModalOpen(false);
      window.setTimeout(focusComposer, 150);
    },
    [focusComposer],
  );

  const handleSendClick = useCallback(async () => {
    await composerRef.current?.submitText();
  }, []);

  return (
    <div className="app-shell" onClick={handleGlobalClick}>
      <form
        id="composerForm"
        className="app-shell__form"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSendClick();
        }}
      >
        <Composer
          ref={composerRef}
          prefs={prefs}
          addHistory={addHistory}
          onTextChange={setHasText}
          onSendActionStart={() => setIsSendingSuccess(true)}
          onSendActionEnd={() => window.setTimeout(() => setIsSendingSuccess(false), 400)}
        />
        <button className="submit-proxy" type="submit" aria-hidden="true" tabIndex={-1}>
          发送
        </button>
      </form>

      <Dock
        prefs={prefs}
        hasText={hasText}
        isSendingSuccess={isSendingSuccess}
        onMenuClick={() => setIsModalOpen(true)}
        onSendClick={handleSendClick}
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
