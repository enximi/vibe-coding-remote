import React, { useCallback, useRef } from 'react';
import { pressKey } from '../utils/api';
import { hapticVibrate } from '../utils/haptics';

export function useContinuousTrigger(actionKey: string, isContinuous: boolean) {
  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const isFiringRef = useRef(false);

  const start = useCallback((e: React.PointerEvent<HTMLButtonElement> | React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (isFiringRef.current) return;
    isFiringRef.current = true;

    hapticVibrate(30);
    try { pressKey(actionKey); } catch (err) {}

    if (isContinuous) {
      timeoutRef.current = window.setTimeout(() => {
        intervalRef.current = window.setInterval(() => {
          hapticVibrate(20);
          try { pressKey(actionKey); } catch (err) {}
        }, 100);
      }, 450);
    } else {
      setTimeout(() => { isFiringRef.current = false; }, 350);
    }
  }, [actionKey, isContinuous]);

  const stop = useCallback((e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (isContinuous) {
      isFiringRef.current = false;
    }
  }, [isContinuous]);

  return {
    onPointerDown: start,
    onPointerUp: stop,
    onPointerLeave: stop,
    onPointerCancel: stop,
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    onClick: (e: React.MouseEvent) => {
      if (!isContinuous && !isFiringRef.current) {
        start(e as any);
      }
    }
  };
}
