import { EnterIcon, SendIcon } from '../../../../ui/icons';
import type { Preferences } from '../../../preferences/model/preferences';

export function EnterBehaviorSettingsSection({
  prefs,
  onEnterBehaviorChange,
}: {
  prefs: Preferences;
  onEnterBehaviorChange: (enterBehavior: Preferences['enterBehavior']) => void;
}) {
  return (
    <section className="settings-group">
      <h3>键盘回车键功能</h3>
      <div className="segmented-control">
        <button
          type="button"
          className={prefs.enterBehavior === 'send' ? 'active' : ''}
          onClick={() => onEnterBehaviorChange('send')}
        >
          <SendIcon width={16} height={16} /> 直接发送
        </button>
        <button
          type="button"
          className={prefs.enterBehavior === 'newline' ? 'active' : ''}
          onClick={() => onEnterBehaviorChange('newline')}
        >
          <EnterIcon width={16} height={16} /> 换行编写
        </button>
      </div>
    </section>
  );
}
