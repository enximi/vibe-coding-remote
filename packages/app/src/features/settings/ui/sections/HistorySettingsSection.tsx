import { CloseIcon } from '../../../../ui/icons';
import type { Preferences } from '../../../preferences/model/preferences';
import { formatHistoryTime } from '../../model/historyTime';

interface HistorySettingsSectionProps {
  history: Preferences['history'];
  onClear: () => void;
  onRemove: (time: number) => void;
  onSelect: (text: string) => void;
}

export function HistorySettingsSection({
  history,
  onClear,
  onRemove,
  onSelect,
}: HistorySettingsSectionProps) {
  return (
    <section className="settings-group history-group">
      <div className="history-header">
        <h3>最近发送记录</h3>
        <button className="history-clear-btn" type="button" onClick={onClear}>
          清空全部
        </button>
      </div>

      <ul className="history-list">
        {history.length === 0 ? (
          <li className="history-item empty">过去犹如一张白纸</li>
        ) : (
          history.map((item) => (
            <li key={item.time} className="history-item">
              <button
                className="history-item-content"
                type="button"
                onClick={() => onSelect(item.text)}
              >
                <div className="history-time">{formatHistoryTime(item.time)}</div>
                <div className="history-text">{item.text}</div>
              </button>
              <button
                className="history-delete-btn"
                type="button"
                aria-label="删除此条记录"
                onClick={(event) => {
                  event.stopPropagation();
                  onRemove(item.time);
                }}
              >
                <CloseIcon width={16} height={16} />
              </button>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
