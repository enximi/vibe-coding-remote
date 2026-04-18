import { useEffect, type Dispatch } from 'react';
import type { ConnectionStatus } from '../../features/runtime/model/connectionMachine';
import type { AppShellAction, AppShellState } from './appShellState';

type UseAppShellEffectsOptions = {
  dispatch: Dispatch<AppShellAction>;
  focusComposer: () => void;
  sendState: AppShellState['sendState'];
  status: ConnectionStatus;
};

export function useAppShellEffects({
  dispatch,
  focusComposer,
  sendState,
  status,
}: UseAppShellEffectsOptions) {
  useEffect(() => {
    dispatch({ type: 'connection_status_changed', status });
  }, [dispatch, status]);

  useEffect(() => {
    const handleGlobalPointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof HTMLElement)) {
        return;
      }

      const isInteractiveOverlay =
        event.target.closest('.action-panel-shell') ||
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

  useEffect(() => {
    if (sendState !== 'success') {
      return;
    }

    const timerId = window.setTimeout(() => {
      dispatch({ type: 'send_feedback_cleared' });
    }, 400);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [dispatch, sendState]);
}
