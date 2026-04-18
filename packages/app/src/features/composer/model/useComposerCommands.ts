import type { ChangeEvent, KeyboardEvent, RefObject } from 'react';
import { useCallback } from 'react';
import type { VibeCodingRemoteBridge } from '../../../types/bridge';
import type { Preferences } from '../../preferences/model/preferences';
import { clearComposerDraft } from './draft';

type UseComposerCommandsOptions = {
  addHistory: (text: string) => void;
  bridge: VibeCodingRemoteBridge;
  enterBehavior: Preferences['enterBehavior'];
  focusInput: () => void;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  isComposing: boolean;
  moveCaretToEnd: () => void;
  onSendActionComplete?: (success: boolean) => void;
  onSendActionStart?: () => void;
  setComposerText: (value: string) => void;
  status: string;
  syncEnterKeyHint: () => void;
  syncTextareaHeight: () => void;
  text: string;
  vibrationEnabled: boolean;
};

export function useComposerCommands({
  addHistory,
  bridge,
  enterBehavior,
  focusInput,
  inputRef,
  isComposing,
  moveCaretToEnd,
  onSendActionComplete,
  onSendActionStart,
  setComposerText,
  status,
  syncEnterKeyHint,
  syncTextareaHeight,
  text,
  vibrationEnabled,
}: UseComposerCommandsOptions) {
  const syncTextareaAfterValueChange = useCallback(() => {
    window.setTimeout(() => {
      syncTextareaHeight();
      syncEnterKeyHint();
      moveCaretToEnd();
    }, 0);
  }, [moveCaretToEnd, syncEnterKeyHint, syncTextareaHeight]);

  const setInputText = useCallback(
    (value: string) => {
      setComposerText(value);
      if (inputRef.current) {
        inputRef.current.value = value;
      }
      syncTextareaAfterValueChange();
    },
    [inputRef, setComposerText, syncTextareaAfterValueChange],
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
      clearComposerDraft();
      if (inputRef.current) {
        inputRef.current.value = '';
      }
      window.setTimeout(syncTextareaHeight, 0);
      window.setTimeout(syncEnterKeyHint, 0);
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
    inputRef,
    onSendActionComplete,
    onSendActionStart,
    setComposerText,
    status,
    syncEnterKeyHint,
    syncTextareaHeight,
    text,
    vibrationEnabled,
  ]);

  const handleTextChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      setComposerText(event.target.value);
      window.setTimeout(syncTextareaHeight, 0);
    },
    [setComposerText, syncTextareaHeight],
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

  const handleKeyUp = useCallback(() => {
    if (!isComposing) {
      syncEnterKeyHint();
    }
  }, [isComposing, syncEnterKeyHint]);

  return {
    handleKeyDown,
    handleKeyUp,
    handleTextChange,
    setInputText,
    submitCurrentText,
  };
}
