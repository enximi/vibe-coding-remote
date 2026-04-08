import React, { useCallback, useRef, useState } from 'react';
import { pressKey } from '../utils/api';
import { hapticVibrate } from '../utils/haptics';

export function useContinuousTrigger(actionKey: string, isContinuous: boolean) {
  const [triggerCount, setTriggerCount] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const fadeoutRef = useRef<number | null>(null);
  const isFiringRef = useRef(false);
  const countRef = useRef(0);

  const incrementCount = () => {
    countRef.current += 1;
    setTriggerCount(countRef.current);
  };

  const start = useCallback((e: React.PointerEvent<HTMLButtonElement> | React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (isFiringRef.current) return;
    isFiringRef.current = true;
    
    if (fadeoutRef.current) clearTimeout(fadeoutRef.current);
    countRef.current = 0;
    setTriggerCount(0);

    hapticVibrate(30);
    try { pressKey(actionKey); } catch (err) {}
    incrementCount();

    if (isContinuous) {
      timeoutRef.current = window.setTimeout(() => {
        intervalRef.current = window.setInterval(() => {
          hapticVibrate(20);
          try { pressKey(actionKey); } catch (err) {}
          incrementCount();
        }, 100);
      }, 450);
    } else {
      setTimeout(() => { isFiringRef.current = false; }, 350);
      fadeoutRef.current = window.setTimeout(() => setTriggerCount(0), 1000);
    }
  }, [actionKey, isContinuous]);

  const stop = useCallback((e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (isContinuous) {
      isFiringRef.current = false;
      if (countRef.current > 1) {
        fadeoutRef.current = window.setTimeout(() => setTriggerCount(0), 600);
      } else {
        setTriggerCount(0);
      }
    }
  }, [isContinuous]);

  return {
    triggerCount,
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
