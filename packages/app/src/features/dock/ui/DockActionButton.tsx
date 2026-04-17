import { useContinuousTrigger } from '../model/useContinuousTrigger';
import type { DockActionConfig } from './dockActionConfigs';

type DockActionButtonProps = DockActionConfig & {
  disabled?: boolean;
  variant: 'dock' | 'popover';
  vibrationEnabled: boolean;
};

export function DockActionButton({
  actionKey,
  ariaLabel,
  icon,
  isContinuous,
  disabled,
  variant,
  vibrationEnabled,
}: DockActionButtonProps) {
  const { triggerCount, ...triggerProps } = useContinuousTrigger(
    actionKey,
    isContinuous,
    vibrationEnabled,
  );

  const mergedProps = disabled ? {} : triggerProps;

  return (
    <button
      className={[
        'dock-btn',
        'dock-btn--action',
        variant === 'popover' ? 'dock-btn--popover' : '',
        disabled ? 'dock-btn--disabled' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      {...mergedProps}
    >
      {icon}
      <div
        className={`combo-counter ${variant === 'popover' ? 'combo-counter--popover' : ''} ${triggerCount > 1 ? 'visible' : ''}`}
      >
        {triggerCount > 1 && <span className="combo-number">x{triggerCount}</span>}
      </div>
    </button>
  );
}
