import type { Preferences } from '../../preferences/preferences';

const MIN_FONT_SIZE = 16;
const MAX_FONT_SIZE = 64;
const FONT_SIZE_STEP = 1;
const DEFAULT_FONT_SIZE = 24;

export function FontSizeSettingsSection({
  prefs,
  onFontSizeChange,
}: {
  prefs: Preferences;
  onFontSizeChange: (fontSize: number) => void;
}) {
  const decreaseDisabled = prefs.fontSize <= MIN_FONT_SIZE;
  const increaseDisabled = prefs.fontSize >= MAX_FONT_SIZE;

  const updateFontSizeByStep = (delta: number) => {
    onFontSizeChange(clampFontSize(prefs.fontSize + delta));
  };

  return (
    <section className="settings-group">
      <h3>编辑区字体大小</h3>
      <div className="settings-card">
        <label className="settings-card-row">
          <span className="settings-card-label">字号数值</span>
          <input
            type="number"
            inputMode="numeric"
            min={MIN_FONT_SIZE}
            max={MAX_FONT_SIZE}
            value={prefs.fontSize || ''}
            onChange={(event) => {
              const value = parseInt(event.target.value, 10);
              onFontSizeChange(Number.isNaN(value) ? 0 : value);
            }}
            onBlur={(event) => {
              let value = parseInt(event.target.value, 10);
              if (Number.isNaN(value) || value === 0) {
                value = DEFAULT_FONT_SIZE;
              }
              value = clampFontSize(value);
              onFontSizeChange(value);
            }}
            style={{ textAlign: 'right' }}
            aria-label="输入字体大小数值"
          />
          <span style={{ color: 'var(--placeholder)', fontSize: 15 }}>px</span>
        </label>
        <div className="settings-card-divider" />
        <div className="settings-slider-wrapper">
          <button
            type="button"
            className="settings-stepper-btn"
            aria-label="减小字体大小"
            disabled={decreaseDisabled}
            onClick={() => updateFontSizeByStep(-FONT_SIZE_STEP)}
          >
            −
          </button>
          <input
            type="range"
            className="settings-slider"
            min={MIN_FONT_SIZE}
            max={MAX_FONT_SIZE}
            step={FONT_SIZE_STEP}
            value={prefs.fontSize}
            onChange={(event) => onFontSizeChange(Number(event.target.value))}
            aria-label="拖动调整字体大小"
          />
          <button
            type="button"
            className="settings-stepper-btn"
            aria-label="增大字体大小"
            disabled={increaseDisabled}
            onClick={() => updateFontSizeByStep(FONT_SIZE_STEP)}
          >
            +
          </button>
        </div>
      </div>
    </section>
  );
}

function clampFontSize(fontSize: number) {
  return Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, fontSize));
}
