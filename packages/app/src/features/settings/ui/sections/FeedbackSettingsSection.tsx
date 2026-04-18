import type { Preferences } from '../../../preferences/model/preferences';

export function FeedbackSettingsSection({
  prefs,
  onToggleVibration,
}: {
  prefs: Preferences;
  onToggleVibration: () => void;
}) {
  return (
    <section className="settings-group">
      <h3>交互反馈</h3>
      <div className="settings-card">
        <label className="settings-card-row" style={{ cursor: 'pointer' }}>
          <span className="settings-card-label" style={{ flex: 1 }}>
            按键触感震动
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={prefs.vibrationEnabled}
            className="settings-switch"
            onClick={(event) => {
              event.preventDefault();
              onToggleVibration();
            }}
            aria-label="开启触感震动反馈"
          >
            <span className="settings-switch-thumb" />
          </button>
        </label>
      </div>
    </section>
  );
}
