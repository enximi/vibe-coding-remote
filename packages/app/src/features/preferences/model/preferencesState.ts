import {
  type ActionPanelActionKey,
  type ActionPanelCell,
  appendHistory,
  clampActionPanelVisibleRows,
  clampHistoryMaxItems,
  clearHistoryItems,
  createActionPanelCellId,
  loadPreferences,
  normalizeActionPanelCells,
  normalizeActionPanelLibraryOrder,
  type Preferences,
  removeHistoryItem,
} from './preferences';

export type PreferencesState = {
  prefs: Preferences;
};

export type PreferencesAction =
  | { type: 'theme_changed'; theme: Preferences['theme'] }
  | { type: 'enter_behavior_changed'; enterBehavior: Preferences['enterBehavior'] }
  | { type: 'font_size_changed'; fontSize: number }
  | { type: 'vibration_toggled' }
  | { type: 'action_panel_visible_rows_changed'; visibleRows: number }
  | {
      type: 'action_panel_cell_placed';
      action: ActionPanelActionKey;
      column: number;
      row: number;
      sourceCellId?: string;
    }
  | { type: 'action_panel_cell_removed'; cellId: string }
  | { type: 'action_panel_library_order_changed'; libraryOrder: ActionPanelActionKey[] }
  | { type: 'history_max_items_changed'; historyMaxItems: number }
  | { type: 'history_added'; text: string }
  | { type: 'history_removed'; time: number }
  | { type: 'history_cleared' };

export function createInitialPreferencesState(): PreferencesState {
  return {
    prefs: loadPreferences(),
  };
}

export function preferencesReducer(
  state: PreferencesState,
  action: PreferencesAction,
): PreferencesState {
  switch (action.type) {
    case 'theme_changed':
      return {
        ...state,
        prefs: { ...state.prefs, theme: action.theme },
      };
    case 'enter_behavior_changed':
      return {
        ...state,
        prefs: { ...state.prefs, enterBehavior: action.enterBehavior },
      };
    case 'font_size_changed':
      return {
        ...state,
        prefs: { ...state.prefs, fontSize: clampFontSize(action.fontSize) },
      };
    case 'vibration_toggled':
      return {
        ...state,
        prefs: { ...state.prefs, vibrationEnabled: !state.prefs.vibrationEnabled },
      };
    case 'action_panel_visible_rows_changed':
      return {
        ...state,
        prefs: {
          ...state.prefs,
          actionPanel: {
            ...state.prefs.actionPanel,
            visibleRows: clampActionPanelVisibleRows(action.visibleRows),
          },
        },
      };
    case 'action_panel_cell_placed':
      return {
        ...state,
        prefs: {
          ...state.prefs,
          actionPanel: placeActionPanelCell(
            state.prefs.actionPanel,
            action.row,
            action.column,
            action.action,
            action.sourceCellId,
          ),
        },
      };
    case 'action_panel_cell_removed':
      return {
        ...state,
        prefs: {
          ...state.prefs,
          actionPanel: finalizeActionPanel({
            ...state.prefs.actionPanel,
            cells: state.prefs.actionPanel.cells.filter((cell) => cell.id !== action.cellId),
          }),
        },
      };
    case 'action_panel_library_order_changed':
      return {
        ...state,
        prefs: {
          ...state.prefs,
          actionPanel: {
            ...state.prefs.actionPanel,
            libraryOrder: normalizeActionPanelLibraryOrder(action.libraryOrder),
          },
        },
      };
    case 'history_added':
      return {
        ...state,
        prefs: {
          ...state.prefs,
          history: appendHistory(
            state.prefs.history,
            action.text,
            state.prefs.historyMaxItems,
          ),
        },
      };
    case 'history_max_items_changed': {
      const historyMaxItems = clampHistoryMaxItems(action.historyMaxItems);
      return {
        ...state,
        prefs: {
          ...state.prefs,
          historyMaxItems,
          history: state.prefs.history.slice(0, historyMaxItems),
        },
      };
    }
    case 'history_removed':
      return {
        ...state,
        prefs: { ...state.prefs, history: removeHistoryItem(state.prefs.history, action.time) },
      };
    case 'history_cleared':
      return {
        ...state,
        prefs: { ...state.prefs, history: clearHistoryItems() },
      };
  }
}

function clampFontSize(fontSize: number): number {
  return Math.max(16, Math.min(64, fontSize));
}

function placeActionPanelCell(
  actionPanel: Preferences['actionPanel'],
  row: number,
  column: number,
  action: ActionPanelActionKey,
  sourceCellId?: string,
): Preferences['actionPanel'] {
  const rowShift = Math.max(0, -Math.floor(row));
  const columnShift = Math.max(0, -Math.floor(column));
  const shiftedCells =
    rowShift > 0 || columnShift > 0
      ? actionPanel.cells.map((cell) => ({
          ...cell,
          row: cell.row + rowShift,
          column: cell.column + columnShift,
        }))
      : actionPanel.cells;
  const normalizedRow = Math.max(0, Math.floor(row) + rowShift);
  const normalizedColumn = Math.max(0, Math.floor(column) + columnShift);
  const sourceCell = sourceCellId
    ? shiftedCells.find((cell) => cell.id === sourceCellId)
    : undefined;
  const targetCell = shiftedCells.find(
    (cell) => cell.row === normalizedRow && cell.column === normalizedColumn,
  );

  let cells: ActionPanelCell[];
  if (sourceCell) {
    cells = shiftedCells.map((cell) => {
      if (cell.id === sourceCell.id) {
        return { ...cell, row: normalizedRow, column: normalizedColumn };
      }

      if (targetCell && cell.id === targetCell.id) {
        return { ...cell, row: sourceCell.row, column: sourceCell.column };
      }

      return cell;
    });
  } else {
    const nextCell: ActionPanelCell = {
      id: createActionPanelCellId(action),
      action,
      row: normalizedRow,
      column: normalizedColumn,
    };
    cells = [...shiftedCells.filter((cell) => cell.id !== targetCell?.id), nextCell];
  }

  return finalizeActionPanel({
    ...actionPanel,
    cells,
  });
}

function finalizeActionPanel(
  actionPanel: Preferences['actionPanel'],
): Preferences['actionPanel'] {
  const cells = normalizeActionPanelCells(actionPanel.cells);

  return {
    ...actionPanel,
    cells,
    visibleRows: clampActionPanelVisibleRows(actionPanel.visibleRows),
  };
}
