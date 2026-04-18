import type { Preferences } from '../../../preferences/model/preferences';

export function FontSizeSettingsSection({
  prefs,
  onFontSizeChange,
}: {
  prefs: Preferences;
  onFontSizeChange: (fontSize: number) => void;
}) {
  return (
    <section className="settings-group">
      <h3>编辑区字体大小</h3>
      <div className="settings-card">
        <label className="settings-card-row">
          <span className="settings-card-label">字号数值</span>
          <input
            type="number"
            inputMode="numeric"
            min={16}
            max={64}
            value={prefs.fontSize || ''}
            onChange={(event) => {
              const value = parseInt(event.target.value, 10);
              onFontSizeChange(Number.isNaN(value) ? 0 : value);
            }}
            onBlur={(event) => {
              let value = parseInt(event.target.value, 10);
              if (Number.isNaN(value) || value === 0) {
                value = 24;
              }
              value = Math.max(16, Math.min(64, value));
              onFontSizeChange(value);
            }}
            style={{ textAlign: 'right' }}
            aria-label="输入字体大小数值"
          />
          <span style={{ color: 'var(--placeholder)', fontSize: 15 }}>px</span>
        </label>
        <div className="settings-card-divider" />
        <div className="settings-slider-wrapper">
          <span className="settings-slider-label" style={{ fontSize: 14 }}>
            A
          </span>
          <input
            type="range"
            className="settings-slider"
            min={16}
            max={64}
            step={1}
            value={prefs.fontSize}
            onChange={(event) => onFontSizeChange(Number(event.target.value))}
            aria-label="拖动调整字体大小"
          />
          <span className="settings-slider-label" style={{ fontSize: 24 }}>
            A
          </span>
        </div>
      </div>
    </section>
  );
}
