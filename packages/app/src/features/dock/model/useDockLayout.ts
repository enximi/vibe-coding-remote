import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

type UseDockLayoutOptions = {
  hasSendButton: boolean;
  onVisibleActionCountChange?: (count: number) => void;
  visibleActionCount: number;
};

export function useDockLayout({
  hasSendButton,
  onVisibleActionCountChange,
  visibleActionCount,
}: UseDockLayoutOptions) {
  const [dockVisibleActionCount, setDockVisibleActionCount] = useState(0);
  const measureDockRef = useRef<HTMLDivElement>(null);
  const measureSettingsRef = useRef<HTMLButtonElement>(null);
  const measureFirstDividerRef = useRef<HTMLDivElement>(null);
  const measureOverflowRef = useRef<HTMLButtonElement>(null);
  const measureSendDividerRef = useRef<HTMLDivElement>(null);
  const measureSendRef = useRef<HTMLButtonElement>(null);
  const measureActionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const measureDockVisibleActionCount = useCallback(() => {
    const measureDock = measureDockRef.current;
    const settingsButton = measureSettingsRef.current;
    const firstDivider = measureFirstDividerRef.current;

    if (!measureDock || !settingsButton || !firstDivider) {
      return;
    }

    const availableWidth = getAvailableContentWidth(measureDock);
    const gap = getGapWidth(measureDock);
    const settingsWidth = getOuterWidth(settingsButton);
    const firstDividerWidth = visibleActionCount > 0 ? getOuterWidth(firstDivider) : 0;
    const actionWidths = Array.from({ length: visibleActionCount }, (_, index) =>
      getOuterWidth(measureActionRefs.current[index]),
    );
    const overflowWidth = getOuterWidth(measureOverflowRef.current);
    const sendDividerWidth = hasSendButton ? getOuterWidth(measureSendDividerRef.current) : 0;
    const sendWidth = hasSendButton ? getOuterWidth(measureSendRef.current) : 0;

    let nextVisibleCount = 0;

    for (let actionCount = visibleActionCount; actionCount >= 0; actionCount -= 1) {
      const hasVisibleActions = actionCount > 0;
      const hasOverflowButton = visibleActionCount > actionCount;
      const childCount =
        1 +
        (visibleActionCount > 0 ? 1 : 0) +
        actionCount +
        (hasOverflowButton ? 1 : 0) +
        (hasSendButton ? 2 : 0);
      const contentWidth =
        settingsWidth +
        firstDividerWidth +
        actionWidths.slice(0, actionCount).reduce((total, width) => total + width, 0) +
        (hasOverflowButton ? overflowWidth : 0) +
        (hasSendButton ? sendDividerWidth + sendWidth : 0) +
        Math.max(0, childCount - 1) * gap;

      if (contentWidth <= availableWidth || (!hasVisibleActions && !hasOverflowButton)) {
        nextVisibleCount = actionCount;
        break;
      }
    }

    setDockVisibleActionCount((currentCount) =>
      currentCount === nextVisibleCount ? currentCount : nextVisibleCount,
    );
  }, [hasSendButton, visibleActionCount]);

  useLayoutEffect(() => {
    setDockVisibleActionCount(visibleActionCount);
  }, [visibleActionCount]);

  useLayoutEffect(() => {
    measureDockVisibleActionCount();

    const measureDock = measureDockRef.current;
    if (!measureDock || typeof ResizeObserver === 'undefined') {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      measureDockVisibleActionCount();
    });

    resizeObserver.observe(measureDock);

    return () => {
      resizeObserver.disconnect();
    };
  }, [measureDockVisibleActionCount]);

  useEffect(() => {
    onVisibleActionCountChange?.(dockVisibleActionCount);
  }, [dockVisibleActionCount, onVisibleActionCountChange]);

  return {
    dockVisibleActionCount,
    measureActionRefs,
    measureDockRef,
    measureFirstDividerRef,
    measureOverflowRef,
    measureSendDividerRef,
    measureSendRef,
    measureSettingsRef,
  };
}

function getAvailableContentWidth(element: HTMLElement) {
  const style = window.getComputedStyle(element);
  const paddingLeft = Number.parseFloat(style.paddingLeft) || 0;
  const paddingRight = Number.parseFloat(style.paddingRight) || 0;

  return element.clientWidth - paddingLeft - paddingRight;
}

function getGapWidth(element: HTMLElement) {
  const style = window.getComputedStyle(element);
  return Number.parseFloat(style.columnGap || style.gap) || 0;
}

function getOuterWidth(element: HTMLElement | null) {
  if (!element) {
    return 0;
  }

  const style = window.getComputedStyle(element);
  const marginLeft = Number.parseFloat(style.marginLeft) || 0;
  const marginRight = Number.parseFloat(style.marginRight) || 0;

  return element.getBoundingClientRect().width + marginLeft + marginRight;
}
