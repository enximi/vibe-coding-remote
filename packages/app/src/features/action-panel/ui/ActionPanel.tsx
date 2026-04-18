import { useMemo } from 'react';
import { SettingsIcon } from '../../../ui/icons';
import { usePreferences } from '../../preferences/model/PreferencesContext';
import { useConnection } from '../../runtime/model/ConnectionContext';
import { ACTION_PANEL_ACTION_BY_KEY } from '../model/actionPanelActions';
import { ActionPanelButton } from './ActionPanelButton';

type ActionPanelProps = {
  hasText: boolean;
  isSendPending: boolean;
  isSendingSuccess: boolean;
  onMenuClick: () => void;
  onSendClick: () => Promise<void>;
};

export function ActionPanel({
  hasText,
  isSendPending,
  isSendingSuccess,
  onMenuClick,
  onSendClick,
}: ActionPanelProps) {
  const { prefs } = usePreferences();
  const { status } = useConnection();
  const { actionPanel } = prefs;
  const displayBounds = useMemo(() => {
    if (actionPanel.cells.length === 0) {
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

    for (const cell of actionPanel.cells) {
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
  }, [actionPanel.cells]);
  const viewportRows = Math.min(actionPanel.visibleRows, displayBounds.rows);
  const cellByPosition = useMemo(() => {
    return new Map(actionPanel.cells.map((cell) => [`${cell.row}:${cell.column}`, cell]));
  }, [actionPanel.cells]);

  return (
    <div
      className="action-panel-shell"
      style={
        {
          '--action-panel-columns': displayBounds.columns,
          '--action-panel-rows': displayBounds.rows,
          '--action-panel-viewport-rows': viewportRows,
        } as React.CSSProperties
      }
    >
      <button
        className={`action-panel-settings ${status !== 'workable' && status !== 'checking' ? 'action-panel-settings--attention' : ''}`}
        type="button"
        aria-label="设置与历史"
        onClick={onMenuClick}
      >
        <SettingsIcon width={16} height={16} />
      </button>

      <div className="action-panel-viewport" aria-label="快捷操作面板">
        <div className="action-panel-grid">
          {Array.from({ length: displayBounds.rows }).map((_, rowOffset) =>
            Array.from({ length: displayBounds.columns }).map((_, columnOffset) => {
              const row = displayBounds.startRow + rowOffset;
              const column = displayBounds.startColumn + columnOffset;
              const cell = cellByPosition.get(`${row}:${column}`);
              const definition = cell ? ACTION_PANEL_ACTION_BY_KEY.get(cell.action) : undefined;

              return (
                <div className="action-panel-cell" key={`${rowOffset}:${columnOffset}`}>
                  {definition && (
                    <ActionPanelButton
                      definition={definition}
                      disabled={status !== 'workable'}
                      hasText={hasText}
                      isSendPending={isSendPending}
                      isSendingSuccess={isSendingSuccess}
                      onSendClick={onSendClick}
                      vibrationEnabled={prefs.vibrationEnabled}
                    />
                  )}
                </div>
              );
            }),
          )}
        </div>
      </div>
    </div>
  );
}
