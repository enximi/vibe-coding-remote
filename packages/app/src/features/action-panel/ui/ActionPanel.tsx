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
  const usedRows = useMemo(() => {
    const occupiedRows = actionPanel.cells.map((cell) => cell.row + 1);
    return Math.max(1, ...occupiedRows);
  }, [actionPanel.cells]);
  const viewportRows = Math.min(actionPanel.visibleRows, usedRows);
  const cellByPosition = useMemo(() => {
    return new Map(actionPanel.cells.map((cell) => [`${cell.row}:${cell.column}`, cell]));
  }, [actionPanel.cells]);

  return (
    <div
      className="action-panel-shell"
      style={
        {
          '--action-panel-columns': actionPanel.columns,
          '--action-panel-rows': actionPanel.rows,
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
          {Array.from({ length: actionPanel.rows }).map((_, row) =>
            Array.from({ length: actionPanel.columns }).map((_, column) => {
              const cell = cellByPosition.get(`${row}:${column}`);
              const definition = cell ? ACTION_PANEL_ACTION_BY_KEY.get(cell.action) : undefined;

              return (
                <div className="action-panel-cell" key={`${row}:${column}`}>
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
