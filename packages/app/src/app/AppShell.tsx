import { Composer } from '../features/composer/ui/Composer';
import { Dock } from '../features/dock/ui/Dock';
import { useViewportOffset } from '../features/runtime/model/useViewportOffset';
import { SettingsModal } from '../features/settings/ui/SettingsModal';
import { useAppShellController } from './useAppShellController';

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
          onSendActionStart={controller.startSendFeedback}
          onSendActionEnd={controller.stopSendFeedback}
        />
        <button className="submit-proxy" type="submit" aria-hidden="true" tabIndex={-1}>
          发送
        </button>
      </form>

      <Dock
        hasText={controller.hasText}
        isSendingSuccess={controller.isSendingSuccess}
        onVisibleActionCountChange={controller.setVisibleDockActionCount}
        onMenuClick={controller.openSettings}
        onSendClick={controller.handleSendClick}
      />

      <SettingsModal
        isOpen={controller.isSettingsOpen}
        onClose={controller.closeSettings}
        onHistorySelect={controller.handleHistorySelect}
        visibleDockActionCount={controller.visibleDockActionCount}
      />
    </div>
  );
}
