import { useCallback, useEffect, useRef, useState } from 'react';
import type { ComposerHandle } from '../../features/composer/ui/Composer';
import { useConnection } from '../../features/runtime/model/ConnectionContext';

export function useAppShellState() {
  const { status } = useConnection();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSendingSuccess, setIsSendingSuccess] = useState(false);
  const [hasText, setHasText] = useState(false);
  const [visibleDockActionCount, setVisibleDockActionCount] = useState<number | null>(null);
  const composerRef = useRef<ComposerHandle>(null);

  useEffect(() => {
    if (status !== 'workable' && status !== 'checking') {
      setIsSettingsOpen(true);
    }
  }, [status]);

  const focusComposer = useCallback(() => {
    composerRef.current?.focusInput();
  }, []);

  const openSettings = useCallback(() => {
    setIsSettingsOpen(true);
  }, []);

  const closeSettings = useCallback(() => {
    setIsSettingsOpen(false);
    focusComposer();
  }, [focusComposer]);

  useEffect(() => {
    const handleGlobalPointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof HTMLElement)) {
        return;
      }

      const isInteractiveOverlay =
        event.target.closest('.dock') ||
        event.target.closest('.modal') ||
        event.target.closest('#composerInput');

      if (!isInteractiveOverlay) {
        focusComposer();
      }
    };

    document.addEventListener('pointerdown', handleGlobalPointerDown);
    return () => {
      document.removeEventListener('pointerdown', handleGlobalPointerDown);
    };
  }, [focusComposer]);

  const handleHistorySelect = useCallback(
    (text: string) => {
      composerRef.current?.setText(text);
      setIsSettingsOpen(false);
      window.setTimeout(focusComposer, 150);
    },
    [focusComposer],
  );

  const handleSendClick = useCallback(async () => {
    await composerRef.current?.submitText();
  }, []);

  const startSendFeedback = useCallback(() => {
    setIsSendingSuccess(true);
  }, []);

  const stopSendFeedback = useCallback(() => {
    window.setTimeout(() => setIsSendingSuccess(false), 400);
  }, []);

  return {
    status,
    composerRef,
    isSettingsOpen,
    isSendingSuccess,
    hasText,
    visibleDockActionCount,
    setHasText,
    setVisibleDockActionCount,
    openSettings,
    closeSettings,
    handleHistorySelect,
    handleSendClick,
    startSendFeedback,
    stopSendFeedback,
  };
}
