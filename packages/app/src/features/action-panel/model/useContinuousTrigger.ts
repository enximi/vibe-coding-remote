import { useCallback, useEffect, useRef, useState } from 'react';
import type { VibeCodingRemoteBridge } from '../../../types/bridge';
import { useBridge } from '../../runtime/model/BridgeContext';
import type { RemotePanelAction } from './actionPanelActions';

const CONTINUOUS_TRIGGER_DELAY_MS = 450;
const CONTINUOUS_TRIGGER_INTERVAL_MS = 100;
const CONTINUOUS_TRIGGER_FADEOUT_MS = 600;
const TAP_TRIGGER_FADEOUT_MS = 1000;
const DRAG_DISTANCE_THRESHOLD_PX = 10;

export function useContinuousTrigger(
  action: RemotePanelAction,
  isContinuous: boolean,
  vibrationEnabled: boolean = true,
) {
  const bridge = useBridge();
  const [triggerCount, setTriggerCount] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const fadeoutRef = useRef<number | null>(null);
  const countRef = useRef(0);
  const pointerIdRef = useRef<number | null>(null);
  const pressStartRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);
  const isLongPressActiveRef = useRef(false);
  const suppressClickRef = useRef(false);

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
      void executePanelAction(bridge, action).catch(() => undefined);
      incrementCount();
    },
    [action, bridge, incrementCount, vibrationEnabled],
  );

  const resetGesture = useCallback(() => {
    pointerIdRef.current = null;
    pressStartRef.current = null;
    isDraggingRef.current = false;
    isLongPressActiveRef.current = false;
    clearTimer(timeoutRef.current, window.clearTimeout);
    clearTimer(intervalRef.current, window.clearInterval);
  }, []);

  const scheduleFadeout = useCallback((delayMs: number) => {
    clearTimer(fadeoutRef.current, window.clearTimeout);
    fadeoutRef.current = window.setTimeout(() => setTriggerCount(0), delayMs);
  }, []);

  const triggerSingle = useCallback(() => {
    clearTimer(fadeoutRef.current, window.clearTimeout);
    countRef.current = 0;
    setTriggerCount(0);
    fireAction(30);
    scheduleFadeout(TAP_TRIGGER_FADEOUT_MS);
  }, [fireAction, scheduleFadeout]);

  const handleLongPressStart = useCallback(() => {
    if (isDraggingRef.current) {
      return;
    }

    clearTimer(fadeoutRef.current, window.clearTimeout);
    countRef.current = 0;
    setTriggerCount(0);
    isLongPressActiveRef.current = true;
    fireAction(30);
    intervalRef.current = window.setInterval(() => {
      fireAction(20);
    }, CONTINUOUS_TRIGGER_INTERVAL_MS);
  }, [fireAction]);

  const start = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (!event.isPrimary) {
        return;
      }

      pointerIdRef.current = event.pointerId;
      pressStartRef.current = { x: event.clientX, y: event.clientY };
      isDraggingRef.current = false;
      isLongPressActiveRef.current = false;
      suppressClickRef.current = false;
      clearTimer(timeoutRef.current, window.clearTimeout);
      clearTimer(intervalRef.current, window.clearInterval);

      if (isContinuous) {
        timeoutRef.current = window.setTimeout(handleLongPressStart, CONTINUOUS_TRIGGER_DELAY_MS);
      }
    },
    [handleLongPressStart, isContinuous],
  );

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    if (pointerIdRef.current !== event.pointerId || isLongPressActiveRef.current) {
      return;
    }

    const pressStart = pressStartRef.current;
    if (!pressStart) {
      return;
    }

    const offsetX = event.clientX - pressStart.x;
    const offsetY = event.clientY - pressStart.y;
    if (Math.hypot(offsetX, offsetY) < DRAG_DISTANCE_THRESHOLD_PX) {
      return;
    }

    isDraggingRef.current = true;
    clearTimer(timeoutRef.current, window.clearTimeout);
  }, []);

  const stop = useCallback(
    (event?: React.PointerEvent<HTMLButtonElement>) => {
      if (event && pointerIdRef.current !== null && event.pointerId !== pointerIdRef.current) {
        return;
      }

      const wasLongPressActive = isLongPressActiveRef.current;
      suppressClickRef.current = wasLongPressActive || isDraggingRef.current;
      resetGesture();

      if (!wasLongPressActive) {
        return;
      }

      if (countRef.current > 1) {
        scheduleFadeout(CONTINUOUS_TRIGGER_FADEOUT_MS);
        return;
      }

      setTriggerCount(0);
    },
    [resetGesture, scheduleFadeout],
  );

  return {
    triggerCount,
    onPointerDown: start,
    onPointerMove: handlePointerMove,
    onPointerUp: stop,
    onPointerLeave: stop,
    onPointerCancel: stop,
    onContextMenu: preventDefault,
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
      if (suppressClickRef.current) {
        suppressClickRef.current = false;
        event.preventDefault();
        return;
      }

      triggerSingle();
    },
  };
}

async function executePanelAction(bridge: VibeCodingRemoteBridge, action: RemotePanelAction) {
  switch (action) {
    case 'enter':
      await bridge.sendKeyChord(['Enter']);
      break;
    case 'escape':
      await bridge.sendKeyChord(['Escape']);
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
    case 'arrow-up':
      await bridge.sendKeyChord(['ArrowUp']);
      break;
    case 'arrow-down':
      await bridge.sendKeyChord(['ArrowDown']);
      break;
    case 'arrow-left':
      await bridge.sendKeyChord(['ArrowLeft']);
      break;
    case 'arrow-right':
      await bridge.sendKeyChord(['ArrowRight']);
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
