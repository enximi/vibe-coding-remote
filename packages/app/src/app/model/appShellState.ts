import type { ConnectionStatus } from '../../features/runtime/model/connectionMachine';

export type AppShellState = {
  hasText: boolean;
  isSettingsOpen: boolean;
  sendState: 'idle' | 'sending' | 'success';
};

export type AppShellAction =
  | { type: 'composer_text_presence_changed'; hasText: boolean }
  | { type: 'history_selected' }
  | { type: 'send_started' }
  | { type: 'send_completed'; success: boolean }
  | { type: 'send_feedback_cleared' }
  | { type: 'settings_opened' }
  | { type: 'settings_closed' }
  | { type: 'connection_status_changed'; status: ConnectionStatus };

export function createInitialAppShellState(): AppShellState {
  return {
    hasText: false,
    isSettingsOpen: false,
    sendState: 'idle',
  };
}

export function appShellReducer(state: AppShellState, action: AppShellAction): AppShellState {
  switch (action.type) {
    case 'composer_text_presence_changed':
      return {
        ...state,
        hasText: action.hasText,
      };
    case 'history_selected':
    case 'settings_closed':
      return {
        ...state,
        isSettingsOpen: false,
      };
    case 'send_started':
      return {
        ...state,
        sendState: 'sending',
      };
    case 'send_completed':
      return {
        ...state,
        sendState: action.success ? 'success' : 'idle',
      };
    case 'send_feedback_cleared':
      return {
        ...state,
        sendState: 'idle',
      };
    case 'settings_opened':
      return {
        ...state,
        isSettingsOpen: true,
      };
    case 'connection_status_changed':
      if (action.status !== 'workable' && action.status !== 'checking') {
        return {
          ...state,
          isSettingsOpen: true,
        };
      }

      return state;
  }
}
