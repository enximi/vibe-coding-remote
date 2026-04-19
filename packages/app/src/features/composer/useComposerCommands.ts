import type { ChangeEvent, KeyboardEvent } from 'react';
import { useCallback } from 'react';
import type { VibeCodingRemoteBridge } from '../../shared/contracts/bridge';
import type { Preferences } from '../preferences/preferences';

type UseComposerCommandsOptions = {
  addHistory: (text: string) => void;
  bridge: VibeCodingRemoteBridge;
  enterBehavior: Preferences['enterBehavior'];
  focusInput: () => void;
  isComposing: boolean;
  moveCaretToEnd: () => void;
  onSendActionComplete?: (success: boolean) => void;
  onSendActionStart?: () => void;
  setComposerText: (value: string) => void;
  status: string;
  text: string;
  vibrationEnabled: boolean;
};

export function useComposerCommands({
  addHistory,
  bridge,
  enterBehavior,
  focusInput,
  isComposing,
  moveCaretToEnd,
  onSendActionComplete,
  onSendActionStart,
  setComposerText,
  status,
  text,
  vibrationEnabled,
}: UseComposerCommandsOptions) {
  const setInputText = useCallback(
    (value: string) => {
      setComposerText(value);
      window.setTimeout(moveCaretToEnd, 0);
    },
    [moveCaretToEnd, setComposerText],
  );

  const submitCurrentText = useCallback(async () => {
    if (status !== 'workable') {
      return;
    }

    if (text.length === 0) {
      try {
        if (vibrationEnabled) {
          bridge.vibrate(30);
        }
        await bridge.sendKeyChord(['Enter']);
      } catch (error) {
        console.error(error);
        if (vibrationEnabled) {
          bridge.vibrate([50, 50, 50]);
        }
      } finally {
        focusInput();
      }
      return;
    }

    let didSucceed = false;
    onSendActionStart?.();

    try {
      if (vibrationEnabled) {
        bridge.vibrate([20, 30, 20]);
      }
      await bridge.inputText(text);
      addHistory(text);
      setComposerText('');
      window.setTimeout(focusInput, 50);
      didSucceed = true;
    } catch (error) {
      console.error(error);
      if (vibrationEnabled) {
        bridge.vibrate([50, 50, 50]);
      }
      focusInput();
    } finally {
      onSendActionComplete?.(didSucceed);
    }
  }, [
    addHistory,
    bridge,
    focusInput,
    onSendActionComplete,
    onSendActionStart,
    setComposerText,
    status,
    text,
    vibrationEnabled,
  ]);

  const handleTextChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      setComposerText(event.target.value);
    },
    [setComposerText],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (isComposing) {
        return;
      }

      if (event.key === 'Backspace' && text.length === 0) {
        if (status !== 'workable') {
          return;
        }
        event.preventDefault();
        if (vibrationEnabled) {
          bridge.vibrate(30);
        }
        void bridge.sendKeyChord(['Backspace']).catch(() => undefined);
        return;
      }

      if (event.key === 'Enter' && !event.shiftKey) {
        if (text.length > 0 && enterBehavior === 'newline') {
          return;
        }

        if (status !== 'workable') {
          return;
        }

        event.preventDefault();
        void submitCurrentText();
      }
    },
    [bridge, enterBehavior, isComposing, status, submitCurrentText, text.length, vibrationEnabled],
  );

  return {
    handleKeyDown,
    handleTextChange,
    setInputText,
    submitCurrentText,
  };
}
