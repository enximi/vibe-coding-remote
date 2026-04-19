import { useMemo } from 'react';
import { Composer } from '../features/composer/Composer';
import { ActionPanel } from '../features/action-panel/ActionPanel';
import { usePreferences } from '../features/preferences/PreferencesContext';
import { getActionPanelDisplayBounds } from '../features/preferences/preferences';
import { useViewportOffset } from '../features/runtime/useViewportOffset';
import { SettingsModal } from '../features/settings/SettingsModal';
import { SettingsIcon } from '../shared/ui/icons';
import { useAppShellController } from './useAppShellController';

export function AppShell() {
  const controller = useAppShellController();
  const { prefs } = usePreferences();
  const hasActionPanelContent = prefs.actionPanel.cells.length > 0;
  const actionPanelDisplayBounds = useMemo(
    () => getActionPanelDisplayBounds(prefs.actionPanel.cells),
    [prefs.actionPanel.cells],
  );
  const actionPanelVisibleRows = hasActionPanelContent
    ? Math.min(prefs.actionPanel.visibleRows, actionPanelDisplayBounds.rows)
    : 0;
  const actionPanelGapCount = Math.max(actionPanelVisibleRows - 1, 0);
  const actionPanelAvoidanceHeight =
    actionPanelVisibleRows > 0
      ? `calc(
          var(--action-panel-bottom-offset) +
            (var(--action-panel-cell-size) * ${actionPanelVisibleRows}) +
            (var(--action-panel-gap) * ${actionPanelGapCount}) +
            (var(--action-panel-padding) * 2) +
            var(--action-panel-top-extra)
        )`
      : '0px';
  useViewportOffset();

  return (
    <div
      className="app-shell"
      style={
        {
          '--action-panel-bottom-offset':
            'calc(env(safe-area-inset-bottom, 4px) + 2px + var(--keyboard-offset))',
          '--action-panel-cell-size': '52px',
          '--action-panel-gap': '8px',
          '--action-panel-padding': '12px',
          '--action-panel-top-extra': '6px',
          '--action-panel-visible-rows': actionPanelVisibleRows,
          '--action-panel-avoidance-height': actionPanelAvoidanceHeight,
        } as React.CSSProperties
      }
    >
      <button
        className={[
          'floating-settings-trigger',
          controller.isSettingsOpen ? 'floating-settings-trigger--inert' : '',
          controller.status !== 'workable' && controller.status !== 'checking'
            ? 'floating-settings-trigger--attention'
            : '',
        ]
          .filter(Boolean)
          .join(' ')}
        type="button"
        aria-label="打开设置与历史"
        onClick={controller.openSettings}
      >
        <span className="floating-settings-trigger__icon" aria-hidden="true">
          <SettingsIcon width={20} height={20} />
        </span>
      </button>

      <form
        id="composerForm"
        className="app-shell__form"
        onSubmit={(event) => {
          event.preventDefault();
          void controller.handleSendClick();
        }}
      >
        <Composer
          ref={controller.composerRef}
          onTextChange={controller.setHasText}
          onSendActionStart={controller.handleSendActionStart}
          onSendActionComplete={controller.handleSendActionComplete}
        />
        <button className="submit-proxy" type="submit" aria-hidden="true" tabIndex={-1}>
          发送
        </button>
      </form>

      {hasActionPanelContent ? (
        <ActionPanel
          hasText={controller.hasText}
          isSendPending={controller.isSendPending}
          isSendingSuccess={controller.isSendingSuccess}
          onSendClick={controller.handleSendClick}
        />
      ) : null}

      <SettingsModal
        isOpen={controller.isSettingsOpen}
        onClose={controller.closeSettings}
        onHistorySelect={controller.handleHistorySelect}
      />
    </div>
  );
}
