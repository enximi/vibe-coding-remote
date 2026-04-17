import { useEffect, useState } from 'react';
import {
  appendHistory,
  clearHistoryItems,
  loadPreferences,
  loadServerAuthToken,
  loadServerEndpoint,
  type Preferences,
  removeHistoryItem,
  savePreferences,
  saveServerAuthToken,
  saveServerEndpoint,
} from './preferences';

export type SetPreferences = (update: Preferences | ((prev: Preferences) => Preferences)) => void;

export type PreferencesStore = ReturnType<typeof usePreferencesStore>;

export function usePreferencesStore() {
  const [prefs, setPrefsState] = useState<Preferences>(loadPreferences);
  const [serverEndpoint, setServerEndpointState] = useState(loadServerEndpoint);
  const [serverAuthToken, setServerAuthTokenState] = useState(loadServerAuthToken);

  useEffect(() => {
    if (prefs.theme === 'system') {
      document.documentElement.removeAttribute('data-theme');
      return;
    }

    document.documentElement.setAttribute('data-theme', prefs.theme);
  }, [prefs.theme]);

  const setPrefs: SetPreferences = (update) => {
    setPrefsState((prev) => {
      const next = typeof update === 'function' ? update(prev) : update;
      savePreferences(next);
      return next;
    });
  };

  const addHistory = (text: string) => {
    setPrefs((prev) => {
      return { ...prev, history: appendHistory(prev.history, text) };
    });
  };

  const removeHistory = (time: number) => {
    setPrefs((prev) => {
      return { ...prev, history: removeHistoryItem(prev.history, time) };
    });
  };

  const clearHistory = () => {
    setPrefs((prev) => ({ ...prev, history: clearHistoryItems() }));
  };

  const setServerEndpoint = (value: string) => {
    const normalizedValue = saveServerEndpoint(value);
    setServerEndpointState(normalizedValue);
  };

  const setServerAuthToken = (value: string) => {
    const normalizedValue = saveServerAuthToken(value);
    setServerAuthTokenState(normalizedValue);
  };

  return {
    prefs,
    setPrefs,
    addHistory,
    removeHistory,
    clearHistory,
    serverEndpoint,
    setServerEndpoint,
    serverAuthToken,
    setServerAuthToken,
  };
}
