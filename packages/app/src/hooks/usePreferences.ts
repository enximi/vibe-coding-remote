import { useEffect, useState } from 'react';
import { PREFERENCES_STORAGE_KEY } from '@voice-bridge/shared';

const MAX_HISTORY_ITEMS = 50;

export type HistoryItem = {
  text: string;
  time: number;
};

export type DockButtons = {
  copy: boolean;
  paste: boolean;
  tab: boolean;
  newline: boolean;
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
    copy: true,
    paste: true,
    tab: true,
    newline: true,
    backspace: true,
  },
  history: [],
};

export function usePreferences() {
  const [prefs, setPrefsState] = useState<Preferences>(loadPreferences);

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

  return { prefs, setPrefs, addHistory, clearHistory };
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
