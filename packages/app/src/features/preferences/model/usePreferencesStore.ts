import { useEffect, useReducer } from 'react';
import { savePreferences, saveServerAuthToken, saveServerEndpoint } from './preferences';
import {
  createInitialPreferencesState,
  type PreferencesAction,
  preferencesReducer,
} from './preferencesState';

export type PreferencesStore = ReturnType<typeof usePreferencesStore>;

export function usePreferencesStore() {
  const [state, dispatch] = useReducer(
    preferencesReducer,
    undefined,
    createInitialPreferencesState,
  );
  const { prefs, serverEndpoint, serverAuthToken } = state;

  useEffect(() => {
    if (prefs.theme === 'system') {
      document.documentElement.removeAttribute('data-theme');
      return;
    }

    document.documentElement.setAttribute('data-theme', prefs.theme);
  }, [prefs.theme]);

  useEffect(() => {
    savePreferences(prefs);
  }, [prefs]);

  useEffect(() => {
    saveServerEndpoint(serverEndpoint);
  }, [serverEndpoint]);

  useEffect(() => {
    saveServerAuthToken(serverAuthToken);
  }, [serverAuthToken]);

  const send = (action: PreferencesAction) => {
    dispatch(action);
  };

  return {
    prefs,
    serverEndpoint,
    serverAuthToken,
    addHistory: (text: string) => send({ type: 'history_added', text }),
    clearHistory: () => send({ type: 'history_cleared' }),
    removeHistory: (time: number) => send({ type: 'history_removed', time }),
    reorderDockButtons: (order: typeof prefs.dockButtonOrder) =>
      send({ type: 'dock_button_order_changed', order }),
    setEnterBehavior: (enterBehavior: typeof prefs.enterBehavior) =>
      send({ type: 'enter_behavior_changed', enterBehavior }),
    setFontSize: (fontSize: number) => send({ type: 'font_size_changed', fontSize }),
    setServerAuthToken: (token: string) => send({ type: 'server_auth_token_changed', token }),
    setServerEndpoint: (endpoint: string) => send({ type: 'server_endpoint_changed', endpoint }),
    setTheme: (theme: typeof prefs.theme) => send({ type: 'theme_changed', theme }),
    toggleDockButton: (key: keyof typeof prefs.dockButtons) =>
      send({ type: 'dock_button_toggled', key }),
    toggleVibration: () => send({ type: 'vibration_toggled' }),
  };
}
