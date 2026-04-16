import { useEffect, useState } from 'react';
import { PREFERENCES_STORAGE_KEY, SERVER_ENDPOINT_STORAGE_KEY, SERVER_AUTH_TOKEN_STORAGE_KEY } from '@voice-bridge/shared';

const MAX_HISTORY_ITEMS = 50;

export type HistoryItem = {
  text: string;
  time: number;
};

export type DockButtons = {
  enter: boolean;
  tab: boolean;
  shiftTab: boolean;
  ctrlC: boolean;
  ctrlV: boolean;
  pasteNewline: boolean;
  backspace: boolean;
};

export type Preferences = {
  theme: 'system' | 'light' | 'dark';
  enterBehavior: 'send' | 'newline';
  dockButtons: DockButtons;
  history: HistoryItem[];
};

type StoredPreferences = Partial<Preferences> & {
  history?: Array<HistoryItem | string>;
  dockButtons?: Partial<DockButtons>;
};

const defaultPreferences: Preferences = {
  theme: 'system',
  enterBehavior: 'send',
  dockButtons: {
    enter: true,
    tab: true,
    shiftTab: true,
    ctrlC: true,
    ctrlV: true,
    pasteNewline: true,
    backspace: true,
  },
  history: [],
};

export function usePreferences() {
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

  const setPrefs = (update: Preferences | ((prev: Preferences) => Preferences)) => {
    setPrefsState((prev) => {
      const next = typeof update === 'function' ? update(prev) : update;
      window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const addHistory = (text: string) => {
    const normalizedText = text.trim();
    if (!normalizedText) {
      return;
    }

    setPrefs((prev) => {
      const history = prev.history.filter((item) => item.text !== normalizedText);
      history.unshift({ text: normalizedText, time: Date.now() });
      history.length = Math.min(history.length, MAX_HISTORY_ITEMS);

      return { ...prev, history };
    });
  };

  const clearHistory = () => {
    setPrefs((prev) => ({ ...prev, history: [] }));
  };

  const setServerEndpoint = (value: string) => {
    const normalizedValue = value.trim();
    if (normalizedValue) {
      window.localStorage.setItem(SERVER_ENDPOINT_STORAGE_KEY, normalizedValue);
    } else {
      window.localStorage.removeItem(SERVER_ENDPOINT_STORAGE_KEY);
    }

    setServerEndpointState(normalizedValue);
  };

  const setServerAuthToken = (value: string) => {
    const normalizedValue = value.trim();
    if (normalizedValue) {
      window.localStorage.setItem(SERVER_AUTH_TOKEN_STORAGE_KEY, normalizedValue);
    } else {
      window.localStorage.removeItem(SERVER_AUTH_TOKEN_STORAGE_KEY);
    }

    setServerAuthTokenState(normalizedValue);
  };

  return {
    prefs,
    setPrefs,
    addHistory,
    clearHistory,
    serverEndpoint,
    setServerEndpoint,
    serverAuthToken,
    setServerAuthToken,
  };
}

function loadPreferences(): Preferences {
  try {
    const saved = window.localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (!saved) {
      return defaultPreferences;
    }

    const parsed = JSON.parse(saved) as StoredPreferences;
    return {
      ...defaultPreferences,
      ...parsed,
      dockButtons: {
        ...defaultPreferences.dockButtons,
        ...parsed.dockButtons,
      },
      history: normalizeHistory(parsed.history),
    };
  } catch {
    return defaultPreferences;
  }
}

function normalizeHistory(history: StoredPreferences['history']): HistoryItem[] {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .map((item) => {
      if (typeof item === 'string') {
        return { text: item, time: Date.now() };
      }

      if (!item || typeof item.text !== 'string' || typeof item.time !== 'number') {
        return null;
      }

      return item;
    })
    .filter((item): item is HistoryItem => item !== null);
}

function loadServerEndpoint(): string {
  return window.localStorage.getItem(SERVER_ENDPOINT_STORAGE_KEY)?.trim() ?? '';
}

function loadServerAuthToken(): string {
  return window.localStorage.getItem(SERVER_AUTH_TOKEN_STORAGE_KEY)?.trim() ?? '';
}
