import {
  appendHistory,
  clearHistoryItems,
  type DockButtonKey,
  loadPreferences,
  loadServerAuthToken,
  loadServerEndpoint,
  type Preferences,
  removeHistoryItem,
} from './preferences';

export type PreferencesState = {
  prefs: Preferences;
  serverEndpoint: string;
  serverAuthToken: string;
};

export type PreferencesAction =
  | { type: 'theme_changed'; theme: Preferences['theme'] }
  | { type: 'enter_behavior_changed'; enterBehavior: Preferences['enterBehavior'] }
  | { type: 'font_size_changed'; fontSize: number }
  | { type: 'vibration_toggled' }
  | { type: 'dock_button_toggled'; key: DockButtonKey }
  | { type: 'dock_button_order_changed'; order: DockButtonKey[] }
  | { type: 'history_added'; text: string }
  | { type: 'history_removed'; time: number }
  | { type: 'history_cleared' }
  | { type: 'server_endpoint_changed'; endpoint: string }
  | { type: 'server_auth_token_changed'; token: string };

export function createInitialPreferencesState(): PreferencesState {
  return {
    prefs: loadPreferences(),
    serverEndpoint: loadServerEndpoint(),
    serverAuthToken: loadServerAuthToken(),
  };
}

export function preferencesReducer(
  state: PreferencesState,
  action: PreferencesAction,
): PreferencesState {
  switch (action.type) {
    case 'theme_changed':
      return {
        ...state,
        prefs: { ...state.prefs, theme: action.theme },
      };
    case 'enter_behavior_changed':
      return {
        ...state,
        prefs: { ...state.prefs, enterBehavior: action.enterBehavior },
      };
    case 'font_size_changed':
      return {
        ...state,
        prefs: { ...state.prefs, fontSize: clampFontSize(action.fontSize) },
      };
    case 'vibration_toggled':
      return {
        ...state,
        prefs: { ...state.prefs, vibrationEnabled: !state.prefs.vibrationEnabled },
      };
    case 'dock_button_toggled':
      return {
        ...state,
        prefs: {
          ...state.prefs,
          dockButtons: {
            ...state.prefs.dockButtons,
            [action.key]: !state.prefs.dockButtons[action.key],
          },
        },
      };
    case 'dock_button_order_changed':
      return {
        ...state,
        prefs: { ...state.prefs, dockButtonOrder: action.order },
      };
    case 'history_added':
      return {
        ...state,
        prefs: { ...state.prefs, history: appendHistory(state.prefs.history, action.text) },
      };
    case 'history_removed':
      return {
        ...state,
        prefs: { ...state.prefs, history: removeHistoryItem(state.prefs.history, action.time) },
      };
    case 'history_cleared':
      return {
        ...state,
        prefs: { ...state.prefs, history: clearHistoryItems() },
      };
    case 'server_endpoint_changed':
      return {
        ...state,
        serverEndpoint: action.endpoint.trim(),
      };
    case 'server_auth_token_changed':
      return {
        ...state,
        serverAuthToken: action.token.trim(),
      };
  }
}

function clampFontSize(fontSize: number): number {
  return Math.max(16, Math.min(64, fontSize));
}
