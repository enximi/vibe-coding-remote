import {
  PREFERENCES_STORAGE_KEY,
  SERVER_AUTH_TOKEN_STORAGE_KEY,
  SERVER_ENDPOINT_STORAGE_KEY,
} from '../../../constants/storage';

const MAX_HISTORY_ITEMS = 50;

export type HistoryItem = {
  text: string;
  time: number;
};

export type ActionPanelActionKey =
  | 'send'
  | 'enter'
  | 'tab'
  | 'shiftTab'
  | 'ctrlC'
  | 'ctrlV'
  | 'pasteNewline'
  | 'backspace';

export type ActionPanelCell = {
  id: string;
  action: ActionPanelActionKey;
  column: number;
  row: number;
};

export type ActionPanelPreferences = {
  cells: ActionPanelCell[];
  columns: number;
  rows: number;
  visibleRows: number;
};

export type Preferences = {
  theme: 'system' | 'light' | 'dark';
  enterBehavior: 'send' | 'newline';
  fontSize: number;
  vibrationEnabled: boolean;
  actionPanel: ActionPanelPreferences;
  history: HistoryItem[];
};

export type StoredPreferences = Partial<Preferences> & {
  history?: Array<HistoryItem | string>;
};

export const ACTION_PANEL_ACTION_KEYS: ActionPanelActionKey[] = [
  'send',
  'backspace',
  'enter',
  'tab',
  'shiftTab',
  'ctrlC',
  'ctrlV',
  'pasteNewline',
];

export const DEFAULT_ACTION_PANEL: ActionPanelPreferences = {
  visibleRows: 3,
  rows: 2,
  columns: 4,
  cells: [
    { id: 'default-send', action: 'send', row: 0, column: 0 },
    { id: 'default-backspace', action: 'backspace', row: 0, column: 1 },
    { id: 'default-enter', action: 'enter', row: 0, column: 2 },
    { id: 'default-tab', action: 'tab', row: 0, column: 3 },
    { id: 'default-shift-tab', action: 'shiftTab', row: 1, column: 0 },
    { id: 'default-ctrl-c', action: 'ctrlC', row: 1, column: 1 },
    { id: 'default-ctrl-v', action: 'ctrlV', row: 1, column: 2 },
    { id: 'default-paste-newline', action: 'pasteNewline', row: 1, column: 3 },
  ],
};

export const DEFAULT_PREFERENCES: Preferences = {
  theme: 'system',
  enterBehavior: 'send',
  fontSize: 24,
  vibrationEnabled: true,
  actionPanel: DEFAULT_ACTION_PANEL,
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
      actionPanel: normalizeActionPanel(parsed.actionPanel),
      history: normalizeHistory(parsed.history),
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(preferences: Preferences): void {
  window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
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

function normalizeActionPanel(
  actionPanel: StoredPreferences['actionPanel'],
): ActionPanelPreferences {
  if (!actionPanel || typeof actionPanel !== 'object') {
    return DEFAULT_ACTION_PANEL;
  }

  const rows = normalizePositiveInteger(actionPanel.rows, DEFAULT_ACTION_PANEL.rows);
  const columns = normalizePositiveInteger(actionPanel.columns, DEFAULT_ACTION_PANEL.columns);
  const cells = Array.isArray(actionPanel.cells)
    ? actionPanel.cells
        .map((cell): ActionPanelCell | null => {
          if (!cell || typeof cell !== 'object') {
            return null;
          }

          const action = cell.action;
          if (!ACTION_PANEL_ACTION_KEYS.includes(action)) {
            return null;
          }

          const row = normalizeIndex(cell.row);
          const column = normalizeIndex(cell.column);
          if (row >= rows || column >= columns) {
            return null;
          }

          return {
            id: typeof cell.id === 'string' && cell.id ? cell.id : createActionPanelCellId(action),
            action,
            row,
            column,
          };
        })
        .filter((cell): cell is ActionPanelCell => cell !== null)
    : DEFAULT_ACTION_PANEL.cells;

  return {
    cells: removeDuplicateActionPanelCells(cells),
    columns,
    rows,
    visibleRows: normalizePositiveInteger(
      actionPanel.visibleRows,
      DEFAULT_ACTION_PANEL.visibleRows,
    ),
  };
}

export function createActionPanelCellId(action: ActionPanelActionKey): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${action}-${crypto.randomUUID()}`;
  }

  return `${action}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function clampActionPanelVisibleRows(value: number): number {
  return normalizePositiveInteger(value, DEFAULT_ACTION_PANEL.visibleRows);
}

export function removeDuplicateActionPanelCells(cells: ActionPanelCell[]): ActionPanelCell[] {
  const occupied = new Set<string>();
  const normalizedCells: ActionPanelCell[] = [];

  for (const cell of cells) {
    const key = `${cell.row}:${cell.column}`;
    if (occupied.has(key)) {
      continue;
    }

    occupied.add(key);
    normalizedCells.push(cell);
  }

  return normalizedCells;
}

function normalizePositiveInteger(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(1, Math.floor(value)) : fallback;
}

function normalizeIndex(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}
