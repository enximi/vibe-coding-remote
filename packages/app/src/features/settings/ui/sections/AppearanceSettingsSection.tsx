import { DarkThemeIcon, LightThemeIcon, SystemThemeIcon } from '../../../../ui/icons';
import type { Preferences } from '../../../preferences/model/preferences';
import type { SetPreferences } from '../../../preferences/model/usePreferencesStore';

export function AppearanceSettingsSection({
  prefs,
  setPrefs,
}: {
  prefs: Preferences;
  setPrefs: SetPreferences;
}) {
  return (
    <section className="settings-group">
      <h3>界面外观</h3>
      <div className="segmented-control">
        <button
          type="button"
          className={prefs.theme === 'system' ? 'active' : ''}
          onClick={() => setPrefs((prev) => ({ ...prev, theme: 'system' }))}
        >
          <SystemThemeIcon width={16} height={16} /> 系统
        </button>
        <button
          type="button"
          className={prefs.theme === 'light' ? 'active' : ''}
          onClick={() => setPrefs((prev) => ({ ...prev, theme: 'light' }))}
        >
          <LightThemeIcon width={16} height={16} /> 浅色
        </button>
        <button
          type="button"
          className={prefs.theme === 'dark' ? 'active' : ''}
          onClick={() => setPrefs((prev) => ({ ...prev, theme: 'dark' }))}
        >
          <DarkThemeIcon width={16} height={16} /> 深色
        </button>
      </div>
    </section>
  );
}
