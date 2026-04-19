import type { ActionPanelActionDefinition } from '../model/actionPanelActions';
import { useContinuousTrigger } from '../model/useContinuousTrigger';

type SendActionDefinition = Extract<ActionPanelActionDefinition, { type: 'send' }>;
type RemoteActionDefinition = Extract<ActionPanelActionDefinition, { type: 'remote' }>;

type ActionPanelButtonProps = {
  definition: ActionPanelActionDefinition;
  disabled?: boolean;
  hasText: boolean;
  isSendPending: boolean;
  isSendingSuccess: boolean;
  onSendClick: () => Promise<void>;
  vibrationEnabled: boolean;
};

export function ActionPanelButton({
  definition,
  disabled = false,
  hasText,
  isSendPending,
  isSendingSuccess,
  onSendClick,
  vibrationEnabled,
}: ActionPanelButtonProps) {
  if (definition.type === 'send') {
    return (
      <SendActionButton
        definition={definition}
        disabled={disabled}
        isSendPending={isSendPending}
        isSendingSuccess={isSendingSuccess}
        hasText={hasText}
        onSendClick={onSendClick}
      />
    );
  }

  return (
    <RemoteActionButton
      definition={definition}
      disabled={disabled}
      vibrationEnabled={vibrationEnabled}
    />
  );
}

const preserveComposerFocus = (event: React.SyntheticEvent<HTMLButtonElement>) => {
  event.preventDefault();
};

function SendActionButton({
  definition,
  disabled = false,
  hasText,
  isSendPending,
  isSendingSuccess,
  onSendClick,
}: {
  definition: SendActionDefinition;
} & Pick<
  ActionPanelButtonProps,
  'disabled' | 'hasText' | 'isSendPending' | 'isSendingSuccess' | 'onSendClick'
>) {
  const isDisabled = disabled || !hasText || isSendPending;

  return (
    <button
      className={[
        'action-panel-btn',
        'action-panel-btn--send',
        isSendingSuccess ? 'action-panel-btn--sent' : '',
        isDisabled ? 'action-panel-btn--disabled' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      type="button"
      tabIndex={-1}
      aria-label={definition.ariaLabel}
      aria-busy={isSendPending}
      aria-disabled={isDisabled}
      onPointerDownCapture={preserveComposerFocus}
      onMouseDown={preserveComposerFocus}
      onClick={(event) => {
        if (isDisabled) {
          event.preventDefault();
          return;
        }
        void onSendClick();
      }}
    >
      {definition.icon}
    </button>
  );
}

function RemoteActionButton({
  definition,
  disabled = false,
  vibrationEnabled,
}: {
  definition: RemoteActionDefinition;
} & Pick<ActionPanelButtonProps, 'disabled' | 'vibrationEnabled'>) {
  const { triggerCount, ...triggerProps } = useContinuousTrigger(
    definition.remoteAction,
    definition.isContinuous,
    vibrationEnabled,
  );
  const mergedProps = disabled ? {} : triggerProps;

  return (
    <button
      className={[
        'action-panel-btn',
        'action-panel-btn--action',
        disabled ? 'action-panel-btn--disabled' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      type="button"
      tabIndex={-1}
      aria-label={definition.ariaLabel}
      disabled={disabled}
      onPointerDownCapture={preserveComposerFocus}
      onMouseDown={preserveComposerFocus}
      {...mergedProps}
    >
      {definition.icon}
      <div className={`combo-counter ${triggerCount > 1 ? 'visible' : ''}`}>
        {triggerCount > 1 && <span className="combo-number">x{triggerCount}</span>}
      </div>
    </button>
  );
}
