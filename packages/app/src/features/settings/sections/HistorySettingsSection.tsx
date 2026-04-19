import { useEffect, useState } from 'react';
import { TrashIcon } from '../../../shared/ui/icons';
import {
  clampHistoryMaxItems,
  type Preferences,
} from '../../preferences/preferences';
import { formatHistoryTime } from '../formatHistoryTime';

interface HistorySettingsSectionProps {
  history: Preferences['history'];
  historyMaxItems: number;
  onClear: () => void;
  onHistoryMaxItemsChange: (historyMaxItems: number) => void;
  onRemove: (time: number) => void;
  onSelect: (text: string) => void;
}

export function HistorySettingsSection({
  history,
  historyMaxItems,
  onClear,
  onHistoryMaxItemsChange,
  onRemove,
  onSelect,
}: HistorySettingsSectionProps) {
  const [historyLimitDraft, setHistoryLimitDraft] = useState(String(historyMaxItems));

  useEffect(() => {
    setHistoryLimitDraft(String(historyMaxItems));
  }, [historyMaxItems]);

  const commitHistoryLimitDraft = () => {
    if (!historyLimitDraft.trim()) {
      setHistoryLimitDraft(String(historyMaxItems));
      return;
    }

    const parsedValue = Number.parseInt(historyLimitDraft, 10);
    const nextValue = clampHistoryMaxItems(parsedValue);
    onHistoryMaxItemsChange(nextValue);
    setHistoryLimitDraft(String(nextValue));
  };

  return (
    <section className="settings-group history-group">
      <div className="history-header">
        <h3>最近发送记录</h3>
        <button className="history-clear-btn" type="button" onClick={onClear}>
          清空全部
        </button>
      </div>

      <div className="history-limit-card">
        <div className="history-limit-copy">
          <strong>历史记录最大条数</strong>
          <p>超过上限后，较早的记录会自动移除。</p>
        </div>
        <div className="settings-stepper" role="group" aria-label="历史记录最大条数">
          <button
            type="button"
            className="settings-stepper-btn"
            aria-label="减少历史记录最大条数"
            disabled={historyMaxItems <= 10}
            onClick={() => onHistoryMaxItemsChange(historyMaxItems - 10)}
          >
            −
          </button>
          <label className="settings-stepper-value" aria-label="输入历史记录最大条数">
            <input
              type="number"
              inputMode="numeric"
              min={10}
              max={200}
              step={10}
              value={historyLimitDraft}
              onChange={(event) => setHistoryLimitDraft(event.target.value)}
              onBlur={commitHistoryLimitDraft}
              onKeyDown={(event) => {
                if (event.key !== 'Enter') {
                  return;
                }

                event.currentTarget.blur();
              }}
              aria-label="输入历史记录最大条数"
            />
            <span>条</span>
          </label>
          <button
            type="button"
            className="settings-stepper-btn"
            aria-label="增加历史记录最大条数"
            disabled={historyMaxItems >= 200}
            onClick={() => onHistoryMaxItemsChange(historyMaxItems + 10)}
          >
            +
          </button>
        </div>
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
                <TrashIcon width={16} height={16} aria-hidden="true" />
              </button>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
