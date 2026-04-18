import { DarkThemeIcon, LightThemeIcon, SystemThemeIcon } from '../../../../ui/icons';
import type { Preferences } from '../../../preferences/model/preferences';

export function AppearanceSettingsSection({
  prefs,
  onThemeChange,
}: {
  prefs: Preferences;
  onThemeChange: (theme: Preferences['theme']) => void;
}) {
  return (
    <section className="settings-group">
      <h3>界面外观</h3>
      <div className="segmented-control">
        <button
          type="button"
          className={prefs.theme === 'system' ? 'active' : ''}
          onClick={() => onThemeChange('system')}
        >
          <SystemThemeIcon width={16} height={16} /> 系统
        </button>
        <button
          type="button"
          className={prefs.theme === 'light' ? 'active' : ''}
          onClick={() => onThemeChange('light')}
        >
          <LightThemeIcon width={16} height={16} /> 浅色
        </button>
        <button
          type="button"
          className={prefs.theme === 'dark' ? 'active' : ''}
          onClick={() => onThemeChange('dark')}
        >
          <DarkThemeIcon width={16} height={16} /> 深色
        </button>
      </div>
    </section>
  );
}
