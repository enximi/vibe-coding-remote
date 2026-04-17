import type { VibeCodingRemoteBridge } from '@vibe-coding-remote/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useBridge } from '../../runtime/bridge/BridgeContext';

const CONTINUOUS_TRIGGER_DELAY_MS = 450;
const CONTINUOUS_TRIGGER_INTERVAL_MS = 100;
const SINGLE_TRIGGER_LOCK_MS = 350;
const SINGLE_TRIGGER_FADEOUT_MS = 1000;
const CONTINUOUS_TRIGGER_FADEOUT_MS = 600;

export type DockAction =
  | 'enter'
  | 'tab'
  | 'shift-tab'
  | 'ctrl-c'
  | 'ctrl-v'
  | 'paste-newline'
  | 'backspace';

export function useContinuousTrigger(
  action: DockAction,
  isContinuous: boolean,
  vibrationEnabled: boolean = true,
) {
  const bridge = useBridge();
  const [triggerCount, setTriggerCount] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const fadeoutRef = useRef<number | null>(null);
  const countRef = useRef(0);
  const isFiringRef = useRef(false);

  useEffect(() => {
    return () => {
      clearTimer(intervalRef.current, window.clearInterval);
      clearTimer(timeoutRef.current, window.clearTimeout);
      clearTimer(fadeoutRef.current, window.clearTimeout);
    };
  }, []);

  const incrementCount = useCallback(() => {
    countRef.current += 1;
    setTriggerCount(countRef.current);
  }, []);

  const fireAction = useCallback(
    (vibration: number | number[]) => {
      if (vibrationEnabled) {
        bridge.vibrate(vibration);
      }
      void executeDockAction(bridge, action).catch(() => undefined);
      incrementCount();
    },
    [action, bridge, incrementCount, vibrationEnabled],
  );

  const start = useCallback(
    (event: React.PointerEvent<HTMLButtonElement> | React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      if (isFiringRef.current) {
        return;
      }

      isFiringRef.current = true;
      clearTimer(fadeoutRef.current, window.clearTimeout);
      countRef.current = 0;
      setTriggerCount(0);

      fireAction(30);

      if (!isContinuous) {
        window.setTimeout(() => {
          isFiringRef.current = false;
        }, SINGLE_TRIGGER_LOCK_MS);
        fadeoutRef.current = window.setTimeout(() => setTriggerCount(0), SINGLE_TRIGGER_FADEOUT_MS);
        return;
      }

      timeoutRef.current = window.setTimeout(() => {
        intervalRef.current = window.setInterval(() => {
          fireAction(20);
        }, CONTINUOUS_TRIGGER_INTERVAL_MS);
      }, CONTINUOUS_TRIGGER_DELAY_MS);
    },
    [fireAction, isContinuous],
  );

  const stop = useCallback(
    (event?: React.SyntheticEvent) => {
      event?.preventDefault();
      clearTimer(timeoutRef.current, window.clearTimeout);
      clearTimer(intervalRef.current, window.clearInterval);

      if (!isContinuous) {
        return;
      }

      isFiringRef.current = false;
      if (countRef.current > 1) {
        fadeoutRef.current = window.setTimeout(
          () => setTriggerCount(0),
          CONTINUOUS_TRIGGER_FADEOUT_MS,
        );
      } else {
        setTriggerCount(0);
      }
    },
    [isContinuous],
  );

  return {
    triggerCount,
    onPointerDown: start,
    onPointerUp: stop,
    onPointerLeave: stop,
    onPointerCancel: stop,
    onContextMenu: preventDefault,
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
      if (!isContinuous && !isFiringRef.current) {
        start(event);
      }
    },
  };
}

async function executeDockAction(bridge: VibeCodingRemoteBridge, action: DockAction) {
  switch (action) {
    case 'enter':
      await bridge.sendKeyChord(['Enter']);
      break;
    case 'tab':
      await bridge.sendKeyChord(['Tab']);
      break;
    case 'shift-tab':
      await bridge.sendKeyChord(['ShiftLeft', 'Tab']);
      break;
    case 'ctrl-c':
      await bridge.sendKeyChord(['ControlLeft', 'KeyC']);
      break;
    case 'ctrl-v':
      await bridge.sendKeyChord(['ControlLeft', 'KeyV']);
      break;
    case 'paste-newline':
      await bridge.inputText('\n');
      break;
    case 'backspace':
      await bridge.sendKeyChord(['Backspace']);
      break;
  }
}

function clearTimer(timerId: number | null, clear: (timerId: number) => void) {
  if (timerId !== null) {
    clear(timerId);
  }
}

function preventDefault(event: React.SyntheticEvent) {
  event.preventDefault();
}
