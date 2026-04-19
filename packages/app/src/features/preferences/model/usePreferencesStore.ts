import { useEffect, useReducer } from 'react';
import {
  type ActionPanelActionKey,
  savePreferences,
  saveServerAuthToken,
  saveServerEndpoint,
} from './preferences';
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
    placeActionPanelCell: (
      action: ActionPanelActionKey,
      row: number,
      column: number,
      sourceCellId?: string,
    ) => send({ type: 'action_panel_cell_placed', action, row, column, sourceCellId }),
    removeHistory: (time: number) => send({ type: 'history_removed', time }),
    removeActionPanelCell: (cellId: string) =>
      send({ type: 'action_panel_cell_removed', cellId }),
    setHistoryMaxItems: (historyMaxItems: number) =>
      send({ type: 'history_max_items_changed', historyMaxItems }),
    setActionPanelLibraryOrder: (libraryOrder: ActionPanelActionKey[]) =>
      send({ type: 'action_panel_library_order_changed', libraryOrder }),
    setActionPanelVisibleRows: (visibleRows: number) =>
      send({ type: 'action_panel_visible_rows_changed', visibleRows }),
    setEnterBehavior: (enterBehavior: typeof prefs.enterBehavior) =>
      send({ type: 'enter_behavior_changed', enterBehavior }),
    setFontSize: (fontSize: number) => send({ type: 'font_size_changed', fontSize }),
    setServerAuthToken: (token: string) => send({ type: 'server_auth_token_changed', token }),
    setServerEndpoint: (endpoint: string) => send({ type: 'server_endpoint_changed', endpoint }),
    setTheme: (theme: typeof prefs.theme) => send({ type: 'theme_changed', theme }),
    toggleVibration: () => send({ type: 'vibration_toggled' }),
  };
}
