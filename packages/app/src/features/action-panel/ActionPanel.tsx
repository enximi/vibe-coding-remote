import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { usePreferences } from '../preferences/PreferencesContext';
import { getActionPanelDisplayBounds } from '../preferences/preferences';
import { useConnection } from '../runtime/ConnectionContext';
import { ACTION_PANEL_ACTION_BY_KEY } from './actionPanelActions';
import { ActionPanelButton } from './ActionPanelButton';

type ActionPanelProps = {
  hasText: boolean;
  isSendPending: boolean;
  isSendingSuccess: boolean;
  onSendClick: () => Promise<void>;
};

export function ActionPanel({
  hasText,
  isSendPending,
  isSendingSuccess,
  onSendClick,
}: ActionPanelProps) {
  const { prefs } = usePreferences();
  const { status } = useConnection();
  const { actionPanel } = prefs;
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const displayBounds = useMemo(
    () => getActionPanelDisplayBounds(actionPanel.cells),
    [actionPanel.cells],
  );
  const viewportRows = Math.min(actionPanel.visibleRows, displayBounds.rows);
  const cellByPosition = useMemo(() => {
    return new Map(actionPanel.cells.map((cell) => [`${cell.row}:${cell.column}`, cell]));
  }, [actionPanel.cells]);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    viewport.scrollLeft = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    viewport.scrollTop = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
  }, [displayBounds.columns, displayBounds.rows, actionPanel.visibleRows]);

  useEffect(() => {
    const handleResize = () => {
      const viewport = viewportRef.current;
      if (!viewport) {
        return;
      }

      viewport.scrollLeft = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
      viewport.scrollTop = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  if (actionPanel.cells.length === 0) {
    return null;
  }

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
      <div
        ref={viewportRef}
        className="action-panel-viewport"
        aria-label="快捷操作面板"
      >
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
