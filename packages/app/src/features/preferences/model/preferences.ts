import {
  PREFERENCES_STORAGE_KEY,
} from '../../../constants/storage';

const DEFAULT_HISTORY_MAX_ITEMS = 50;
const MIN_HISTORY_MAX_ITEMS = 10;
const MAX_HISTORY_MAX_ITEMS = 200;

export type HistoryItem = {
  text: string;
  time: number;
};

export type ActionPanelActionKey =
  | 'send'
  | 'enter'
  | 'escape'
  | 'tab'
  | 'shiftTab'
  | 'ctrlC'
  | 'ctrlV'
  | 'pasteNewline'
  | 'backspace'
  | 'arrowUp'
  | 'arrowDown'
  | 'arrowLeft'
  | 'arrowRight';

export type ActionPanelCell = {
  id: string;
  action: ActionPanelActionKey;
  column: number;
  row: number;
};

export type ActionPanelPreferences = {
  cells: ActionPanelCell[];
  libraryOrder: ActionPanelActionKey[];
  visibleRows: number;
};

export type Preferences = {
  theme: 'system' | 'light' | 'dark';
  enterBehavior: 'send' | 'newline';
  fontSize: number;
  historyMaxItems: number;
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
  'escape',
  'tab',
  'shiftTab',
  'ctrlC',
  'ctrlV',
  'pasteNewline',
  'arrowUp',
  'arrowDown',
  'arrowLeft',
  'arrowRight',
];

export const DEFAULT_ACTION_PANEL: ActionPanelPreferences = {
  visibleRows: 2,
  libraryOrder: [...ACTION_PANEL_ACTION_KEYS],
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
  historyMaxItems: DEFAULT_HISTORY_MAX_ITEMS,
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
      historyMaxItems: clampHistoryMaxItems(parsed.historyMaxItems),
      vibrationEnabled:
        typeof parsed.vibrationEnabled === 'boolean'
          ? parsed.vibrationEnabled
          : DEFAULT_PREFERENCES.vibrationEnabled,
      actionPanel: normalizeActionPanel(parsed.actionPanel),
      history: normalizeHistory(parsed.history).slice(
        0,
        clampHistoryMaxItems(parsed.historyMaxItems),
      ),
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(preferences: Preferences): void {
  window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
}

export function appendHistory(
  history: HistoryItem[],
  text: string,
  maxItems: number,
): HistoryItem[] {
  const normalizedText = text.trim();
  if (!normalizedText) {
    return history;
  }

  const nextHistory = history.filter((item) => item.text !== normalizedText);
  nextHistory.unshift({ text: normalizedText, time: Date.now() });
  nextHistory.length = Math.min(nextHistory.length, clampHistoryMaxItems(maxItems));
  return nextHistory;
}

export function removeHistoryItem(history: HistoryItem[], time: number): HistoryItem[] {
  return history.filter((item) => item.time !== time);
}

export function clearHistoryItems(): HistoryItem[] {
  return [];
}

export function clampHistoryMaxItems(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_HISTORY_MAX_ITEMS;
  }

  return Math.max(
    MIN_HISTORY_MAX_ITEMS,
    Math.min(MAX_HISTORY_MAX_ITEMS, Math.floor(value)),
  );
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

          return {
            id: typeof cell.id === 'string' && cell.id ? cell.id : createActionPanelCellId(action),
            action,
            row,
            column,
          };
        })
        .filter((cell): cell is ActionPanelCell => cell !== null)
    : DEFAULT_ACTION_PANEL.cells;
  const libraryOrder = normalizeActionPanelLibraryOrder(actionPanel.libraryOrder);
  const normalizedCells = normalizeActionPanelCells(cells);

  return {
    cells: normalizedCells,
    libraryOrder,
    visibleRows: clampActionPanelVisibleRows(actionPanel.visibleRows),
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

export function normalizeActionPanelLibraryOrder(
  value: unknown,
): ActionPanelActionKey[] {
  if (!Array.isArray(value)) {
    return [...ACTION_PANEL_ACTION_KEYS];
  }

  const seen = new Set<ActionPanelActionKey>();
  const normalized: ActionPanelActionKey[] = [];

  for (const item of value) {
    if (!ACTION_PANEL_ACTION_KEYS.includes(item) || seen.has(item)) {
      continue;
    }

    seen.add(item);
    normalized.push(item);
  }

  for (const action of ACTION_PANEL_ACTION_KEYS) {
    if (seen.has(action)) {
      continue;
    }

    normalized.push(action);
  }

  return normalized;
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

export function normalizeActionPanelCells(cells: ActionPanelCell[]): ActionPanelCell[] {
  const deduplicatedCells = removeDuplicateActionPanelCells(cells);
  if (deduplicatedCells.length === 0) {
    return deduplicatedCells;
  }

  let minRow = Number.POSITIVE_INFINITY;
  let minColumn = Number.POSITIVE_INFINITY;

  for (const cell of deduplicatedCells) {
    minRow = Math.min(minRow, cell.row);
    minColumn = Math.min(minColumn, cell.column);
  }

  if (minRow === 0 && minColumn === 0) {
    return deduplicatedCells;
  }

  return deduplicatedCells.map((cell) => ({
    ...cell,
    row: cell.row - minRow,
    column: cell.column - minColumn,
  }));
}

export function getActionPanelDisplayBounds(cells: ActionPanelCell[]) {
  if (cells.length === 0) {
    return {
      columns: 1,
      rows: 1,
      startColumn: 0,
      startRow: 0,
    };
  }

  let minRow = Number.POSITIVE_INFINITY;
  let maxRow = Number.NEGATIVE_INFINITY;
  let minColumn = Number.POSITIVE_INFINITY;
  let maxColumn = Number.NEGATIVE_INFINITY;

  for (const cell of cells) {
    minRow = Math.min(minRow, cell.row);
    maxRow = Math.max(maxRow, cell.row);
    minColumn = Math.min(minColumn, cell.column);
    maxColumn = Math.max(maxColumn, cell.column);
  }

  return {
    columns: maxColumn - minColumn + 1,
    rows: maxRow - minRow + 1,
    startColumn: minColumn,
    startRow: minRow,
  };
}

export function getActionPanelEditorBounds(cells: ActionPanelCell[]) {
  if (cells.length === 0) {
    return {
      columns: 1,
      rows: 1,
      startColumn: 0,
      startRow: 0,
    };
  }

  let maxRow = 0;
  let maxColumn = 0;

  for (const cell of cells) {
    maxRow = Math.max(maxRow, cell.row);
    maxColumn = Math.max(maxColumn, cell.column);
  }

  return {
    columns: maxColumn + 3,
    rows: maxRow + 3,
    startColumn: -1,
    startRow: -1,
  };
}

function normalizePositiveInteger(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(1, Math.floor(value)) : fallback;
}

function normalizeIndex(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}
