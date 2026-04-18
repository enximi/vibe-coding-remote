import { Composer } from '../../features/composer/ui/Composer';
import { ActionPanel } from '../../features/action-panel/ui/ActionPanel';
import { useViewportOffset } from '../../features/runtime/model/useViewportOffset';
import { SettingsModal } from '../../features/settings/ui/SettingsModal';
import { useAppShellController } from '../model/useAppShellController';

export function AppShell() {
  const controller = useAppShellController();
  useViewportOffset();

  return (
    <div className="app-shell">
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

      <ActionPanel
        hasText={controller.hasText}
        isSendPending={controller.isSendPending}
        isSendingSuccess={controller.isSendingSuccess}
        onMenuClick={controller.openSettings}
        onSendClick={controller.handleSendClick}
      />

      <SettingsModal
        isOpen={controller.isSettingsOpen}
        onClose={controller.closeSettings}
        onHistorySelect={controller.handleHistorySelect}
      />
    </div>
  );
}
