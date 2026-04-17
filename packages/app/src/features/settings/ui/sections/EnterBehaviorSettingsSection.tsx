import { EnterIcon, SendIcon } from '../../../../ui/icons';
import type { Preferences } from '../../../preferences/model/preferences';
import type { SetPreferences } from '../../../preferences/model/usePreferencesStore';

export function EnterBehaviorSettingsSection({
  prefs,
  setPrefs,
}: {
  prefs: Preferences;
  setPrefs: SetPreferences;
}) {
  return (
    <section className="settings-group">
      <h3>键盘回车键功能</h3>
      <div className="segmented-control">
        <button
          type="button"
          className={prefs.enterBehavior === 'send' ? 'active' : ''}
          onClick={() => setPrefs((prev) => ({ ...prev, enterBehavior: 'send' }))}
        >
          <SendIcon width={16} height={16} /> 直接发送
        </button>
        <button
          type="button"
          className={prefs.enterBehavior === 'newline' ? 'active' : ''}
          onClick={() => setPrefs((prev) => ({ ...prev, enterBehavior: 'newline' }))}
        >
          <EnterIcon width={16} height={16} /> 换行编写
        </button>
      </div>
    </section>
  );
}
