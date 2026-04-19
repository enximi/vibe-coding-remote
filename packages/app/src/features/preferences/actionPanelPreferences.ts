import type {
  ActionPanelActionKey,
  ActionPanelCell,
  ActionPanelPreferences,
  StoredPreferences,
} from './preferenceTypes';

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
    { id: 'default-escape', action: 'escape', row: 0, column: 0 },
    { id: 'default-arrow-up', action: 'arrowUp', row: 0, column: 1 },
    { id: 'default-enter', action: 'enter', row: 0, column: 2 },
    { id: 'default-ctrl-c', action: 'ctrlC', row: 0, column: 3 },
    { id: 'default-arrow-left', action: 'arrowLeft', row: 1, column: 0 },
    { id: 'default-arrow-down', action: 'arrowDown', row: 1, column: 1 },
    { id: 'default-arrow-right', action: 'arrowRight', row: 1, column: 2 },
    { id: 'default-send', action: 'send', row: 1, column: 3 },
  ],
};

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

export function normalizeStoredActionPanel(
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

function normalizePositiveInteger(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(1, Math.floor(value)) : fallback;
}

function normalizeIndex(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}
