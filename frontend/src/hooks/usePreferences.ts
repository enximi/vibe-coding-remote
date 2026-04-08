import { useState, useEffect } from 'react';

const PREFS_KEY = 'voicebridge.mobile.prefs';

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

const defaultPrefs: Preferences = {
  theme: 'system',
  enterBehavior: 'send',
  dockButtons: {
    copy: true,
    paste: true,
    tab: true,
    newline: true,
    backspace: true
  },
  history: []
};

export function usePreferences() {
  const [prefs, setPrefsState] = useState<Preferences>(() => {
    try {
      const saved = localStorage.getItem(PREFS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.history) {
          parsed.history = parsed.history.map((h: any) => typeof h === 'string' ? { text: h, time: Date.now() } : h);
        }
        return {
          ...defaultPrefs,
          ...parsed,
          dockButtons: { ...defaultPrefs.dockButtons, ...(parsed.dockButtons || {}) }
        };
      }
    } catch (e) {}
    return defaultPrefs;
  });

  const setPrefs = (newPrefs: Preferences | ((prev: Preferences) => Preferences)) => {
    setPrefsState(prev => {
      const updated = typeof newPrefs === 'function' ? newPrefs(prev) : newPrefs;
      localStorage.setItem(PREFS_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    if (prefs.theme === 'system') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', prefs.theme);
    }
  }, [prefs.theme]);

  const addHistory = (text: string) => {
    text = text.trim();
    if (!text) return;
    setPrefs(p => {
      const filtered = p.history.filter(item => item.text !== text);
      filtered.unshift({ text, time: Date.now() });
      if (filtered.length > 50) filtered.pop();
      return { ...p, history: filtered };
    });
  };

  const clearHistory = () => {
    setPrefs(p => ({ ...p, history: [] }));
  };

  return { prefs, setPrefs, addHistory, clearHistory };
}
