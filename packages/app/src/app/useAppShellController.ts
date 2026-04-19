import { useCallback, useReducer, useRef } from 'react';
import type { ComposerHandle } from '../features/composer/Composer';
import { useConnection } from '../features/runtime/ConnectionContext';
import { appShellReducer, createInitialAppShellState } from './appShellState';
import { useAppShellEffects } from './useAppShellEffects';

export function useAppShellController() {
  const { status } = useConnection();
  const [state, dispatch] = useReducer(appShellReducer, undefined, createInitialAppShellState);
  const composerRef = useRef<ComposerHandle>(null);

  const focusComposer = useCallback(() => {
    composerRef.current?.focusInput();
  }, []);

  useAppShellEffects({
    dispatch,
    focusComposer,
    sendState: state.sendState,
    status,
  });

  const openSettings = useCallback(() => {
    dispatch({ type: 'settings_opened' });
  }, []);

  const closeSettings = useCallback(() => {
    dispatch({ type: 'settings_closed' });
    focusComposer();
  }, [focusComposer]);

  const handleHistorySelect = useCallback(
    (text: string) => {
      composerRef.current?.setText(text);
      dispatch({ type: 'history_selected' });
      window.setTimeout(focusComposer, 150);
    },
    [focusComposer],
  );

  const handleSendClick = useCallback(async () => {
    await composerRef.current?.submitText();
  }, []);

  const handleSendActionStart = useCallback(() => {
    dispatch({ type: 'send_started' });
  }, []);

  const handleSendActionComplete = useCallback((success: boolean) => {
    dispatch({ type: 'send_completed', success });
  }, []);

  return {
    composerRef,
    closeSettings,
    handleHistorySelect,
    handleSendActionComplete,
    handleSendActionStart,
    handleSendClick,
    hasText: state.hasText,
    isSendPending: state.sendState === 'sending',
    isSendingSuccess: state.sendState === 'success',
    isSettingsOpen: state.isSettingsOpen,
    openSettings,
    setHasText: (hasText: boolean) => dispatch({ type: 'composer_text_presence_changed', hasText }),
    status,
  };
}
