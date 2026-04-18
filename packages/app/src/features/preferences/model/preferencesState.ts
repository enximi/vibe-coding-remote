import {
  type ActionPanelActionKey,
  type ActionPanelCell,
  appendHistory,
  clampActionPanelVisibleRows,
  clearHistoryItems,
  createActionPanelCellId,
  loadPreferences,
  loadServerAuthToken,
  loadServerEndpoint,
  type Preferences,
  removeDuplicateActionPanelCells,
  removeHistoryItem,
} from './preferences';

export type PreferencesState = {
  prefs: Preferences;
  serverEndpoint: string;
  serverAuthToken: string;
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
  | { type: 'action_panel_row_inserted'; index: number }
  | { type: 'action_panel_row_removed'; index: number }
  | { type: 'action_panel_column_inserted'; index: number }
  | { type: 'action_panel_column_removed'; index: number }
  | { type: 'history_added'; text: string }
  | { type: 'history_removed'; time: number }
  | { type: 'history_cleared' }
  | { type: 'server_endpoint_changed'; endpoint: string }
  | { type: 'server_auth_token_changed'; token: string };

export function createInitialPreferencesState(): PreferencesState {
  return {
    prefs: loadPreferences(),
    serverEndpoint: loadServerEndpoint(),
    serverAuthToken: loadServerAuthToken(),
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
          actionPanel: {
            ...state.prefs.actionPanel,
            cells: state.prefs.actionPanel.cells.filter((cell) => cell.id !== action.cellId),
          },
        },
      };
    case 'action_panel_row_inserted':
      return {
        ...state,
        prefs: {
          ...state.prefs,
          actionPanel: insertActionPanelRow(state.prefs.actionPanel, action.index),
        },
      };
    case 'action_panel_row_removed':
      return {
        ...state,
        prefs: {
          ...state.prefs,
          actionPanel: removeActionPanelRow(state.prefs.actionPanel, action.index),
        },
      };
    case 'action_panel_column_inserted':
      return {
        ...state,
        prefs: {
          ...state.prefs,
          actionPanel: insertActionPanelColumn(state.prefs.actionPanel, action.index),
        },
      };
    case 'action_panel_column_removed':
      return {
        ...state,
        prefs: {
          ...state.prefs,
          actionPanel: removeActionPanelColumn(state.prefs.actionPanel, action.index),
        },
      };
    case 'history_added':
      return {
        ...state,
        prefs: { ...state.prefs, history: appendHistory(state.prefs.history, action.text) },
      };
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
    case 'server_endpoint_changed':
      return {
        ...state,
        serverEndpoint: action.endpoint.trim(),
      };
    case 'server_auth_token_changed':
      return {
        ...state,
        serverAuthToken: action.token.trim(),
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
  const normalizedRow = Math.max(0, Math.min(actionPanel.rows - 1, Math.floor(row)));
  const normalizedColumn = Math.max(0, Math.min(actionPanel.columns - 1, Math.floor(column)));
  const sourceCell = sourceCellId
    ? actionPanel.cells.find((cell) => cell.id === sourceCellId)
    : undefined;
  const targetCell = actionPanel.cells.find(
    (cell) => cell.row === normalizedRow && cell.column === normalizedColumn,
  );

  let cells: ActionPanelCell[];
  if (sourceCell) {
    cells = actionPanel.cells.map((cell) => {
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
    cells = [...actionPanel.cells.filter((cell) => cell.id !== targetCell?.id), nextCell];
  }

  return {
    ...actionPanel,
    cells: removeDuplicateActionPanelCells(cells),
  };
}

function insertActionPanelRow(
  actionPanel: Preferences['actionPanel'],
  index: number,
): Preferences['actionPanel'] {
  const normalizedIndex = Math.max(0, Math.min(actionPanel.rows, Math.floor(index)));

  return {
    ...actionPanel,
    rows: actionPanel.rows + 1,
    cells: actionPanel.cells.map((cell) =>
      cell.row >= normalizedIndex ? { ...cell, row: cell.row + 1 } : cell,
    ),
  };
}

function removeActionPanelRow(
  actionPanel: Preferences['actionPanel'],
  index: number,
): Preferences['actionPanel'] {
  if (actionPanel.rows <= 1) {
    return actionPanel;
  }

  const normalizedIndex = Math.max(0, Math.min(actionPanel.rows - 1, Math.floor(index)));

  return {
    ...actionPanel,
    rows: actionPanel.rows - 1,
    cells: actionPanel.cells
      .filter((cell) => cell.row !== normalizedIndex)
      .map((cell) => (cell.row > normalizedIndex ? { ...cell, row: cell.row - 1 } : cell)),
  };
}

function insertActionPanelColumn(
  actionPanel: Preferences['actionPanel'],
  index: number,
): Preferences['actionPanel'] {
  const normalizedIndex = Math.max(0, Math.min(actionPanel.columns, Math.floor(index)));

  return {
    ...actionPanel,
    columns: actionPanel.columns + 1,
    cells: actionPanel.cells.map((cell) =>
      cell.column >= normalizedIndex ? { ...cell, column: cell.column + 1 } : cell,
    ),
  };
}

function removeActionPanelColumn(
  actionPanel: Preferences['actionPanel'],
  index: number,
): Preferences['actionPanel'] {
  if (actionPanel.columns <= 1) {
    return actionPanel;
  }

  const normalizedIndex = Math.max(0, Math.min(actionPanel.columns - 1, Math.floor(index)));

  return {
    ...actionPanel,
    columns: actionPanel.columns - 1,
    cells: actionPanel.cells
      .filter((cell) => cell.column !== normalizedIndex)
      .map((cell) =>
        cell.column > normalizedIndex ? { ...cell, column: cell.column - 1 } : cell,
      ),
  };
}
