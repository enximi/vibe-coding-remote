import {
  PREFERENCES_STORAGE_KEY,
  SERVER_AUTH_TOKEN_STORAGE_KEY,
  SERVER_ENDPOINT_STORAGE_KEY,
} from '@vibe-coding-remote/shared';

const MAX_HISTORY_ITEMS = 50;

export type HistoryItem = {
  text: string;
  time: number;
};

export type DockButtonKey =
  | 'enter'
  | 'tab'
  | 'shiftTab'
  | 'ctrlC'
  | 'ctrlV'
  | 'pasteNewline'
  | 'backspace';

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
  fontSize: number;
  vibrationEnabled: boolean;
  dockButtons: DockButtons;
  dockButtonOrder: DockButtonKey[];
  history: HistoryItem[];
};

export type StoredPreferences = Partial<Preferences> & {
  history?: Array<HistoryItem | string>;
  dockButtons?: Partial<DockButtons>;
  dockButtonOrder?: DockButtonKey[];
};

export const DEFAULT_DOCK_BUTTON_ORDER: DockButtonKey[] = [
  'backspace',
  'enter',
  'tab',
  'shiftTab',
  'ctrlC',
  'ctrlV',
  'pasteNewline',
];

export const DEFAULT_PREFERENCES: Preferences = {
  theme: 'system',
  enterBehavior: 'send',
  fontSize: 24,
  vibrationEnabled: true,
  dockButtons: {
    enter: true,
    tab: true,
    shiftTab: true,
    ctrlC: true,
    ctrlV: true,
    pasteNewline: true,
    backspace: true,
  },
  dockButtonOrder: DEFAULT_DOCK_BUTTON_ORDER,
  history: [],
};

export function loadPreferences(): Preferences {
  try {
    const saved = window.localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (!saved) {
      return DEFAULT_PREFERENCES;
    }

    const parsed = JSON.parse(saved) as StoredPreferences;
    return {
      ...DEFAULT_PREFERENCES,
      ...parsed,
      fontSize:
        typeof parsed.fontSize === 'number'
          ? Math.max(16, Math.min(64, parsed.fontSize))
          : DEFAULT_PREFERENCES.fontSize,
      vibrationEnabled:
        typeof parsed.vibrationEnabled === 'boolean'
          ? parsed.vibrationEnabled
          : DEFAULT_PREFERENCES.vibrationEnabled,
      dockButtons: {
        ...DEFAULT_PREFERENCES.dockButtons,
        ...parsed.dockButtons,
      },
      dockButtonOrder: normalizeDockButtonOrder(parsed.dockButtonOrder),
      history: normalizeHistory(parsed.history),
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(preferences: Preferences): void {
  window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
}

export function normalizeDockButtonOrder(
  order: StoredPreferences['dockButtonOrder'],
): DockButtonKey[] {
  const normalizedOrder: DockButtonKey[] = [];

  if (Array.isArray(order)) {
    for (const key of order) {
      if (DEFAULT_DOCK_BUTTON_ORDER.includes(key) && !normalizedOrder.includes(key)) {
        normalizedOrder.push(key);
      }
    }
  }

  for (const key of DEFAULT_DOCK_BUTTON_ORDER) {
    if (!normalizedOrder.includes(key)) {
      normalizedOrder.push(key);
    }
  }

  return normalizedOrder;
}

export function appendHistory(history: HistoryItem[], text: string): HistoryItem[] {
  const normalizedText = text.trim();
  if (!normalizedText) {
    return history;
  }

  const nextHistory = history.filter((item) => item.text !== normalizedText);
  nextHistory.unshift({ text: normalizedText, time: Date.now() });
  nextHistory.length = Math.min(nextHistory.length, MAX_HISTORY_ITEMS);
  return nextHistory;
}

export function removeHistoryItem(history: HistoryItem[], time: number): HistoryItem[] {
  return history.filter((item) => item.time !== time);
}

export function clearHistoryItems(): HistoryItem[] {
  return [];
}

export function loadServerEndpoint(): string {
  return window.localStorage.getItem(SERVER_ENDPOINT_STORAGE_KEY)?.trim() ?? '';
}

export function saveServerEndpoint(value: string): string {
  const normalizedValue = value.trim();
  if (normalizedValue) {
    window.localStorage.setItem(SERVER_ENDPOINT_STORAGE_KEY, normalizedValue);
  } else {
    window.localStorage.removeItem(SERVER_ENDPOINT_STORAGE_KEY);
  }

  return normalizedValue;
}

export function loadServerAuthToken(): string {
  return window.localStorage.getItem(SERVER_AUTH_TOKEN_STORAGE_KEY)?.trim() ?? '';
}

export function saveServerAuthToken(value: string): string {
  const normalizedValue = value.trim();
  if (normalizedValue) {
    window.localStorage.setItem(SERVER_AUTH_TOKEN_STORAGE_KEY, normalizedValue);
  } else {
    window.localStorage.removeItem(SERVER_AUTH_TOKEN_STORAGE_KEY);
  }

  return normalizedValue;
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
