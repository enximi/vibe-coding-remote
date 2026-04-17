import { type TouchEvent, useCallback, useRef } from 'react';

export function useSheetModal(onClose: () => void) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isClosingRef = useRef(false);
  const touchStartY = useRef(0);
  const scrollStartY = useRef(0);

  const resetCloseAnimation = useCallback(() => {
    if (contentRef.current) {
      contentRef.current.style.transform = '';
    }
    if (dialogRef.current) {
      dialogRef.current.classList.remove('modal-animating');
      dialogRef.current.classList.remove('modal-closing');
      dialogRef.current.style.setProperty('--backdrop-opacity', '1');
    }
  }, []);

  const requestClose = useCallback(() => {
    if (isClosingRef.current) {
      return;
    }

    isClosingRef.current = true;
    if (dialogRef.current?.open) {
      dialogRef.current.close();
    }
    resetCloseAnimation();
    onClose();
  }, [onClose, resetCloseAnimation]);

  const handleTouchStart = useCallback((event: TouchEvent) => {
    touchStartY.current = event.touches[0].clientY;
    scrollStartY.current = contentRef.current?.scrollTop || 0;
    if (contentRef.current) {
      contentRef.current.style.transition = 'none';
    }
    if (dialogRef.current) {
      dialogRef.current.classList.remove('modal-animating');
      dialogRef.current.classList.remove('modal-closing');
    }
  }, []);

  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (!contentRef.current) {
      return;
    }

    const deltaY = event.touches[0].clientY - touchStartY.current;
    if (scrollStartY.current <= 0 && deltaY > 0) {
      const translateY = deltaY * 0.6;
      contentRef.current.style.transform = `translateY(${translateY}px)`;

      if (dialogRef.current) {
        const fadeRatio = Math.max(0, 1 - translateY / 300);
        dialogRef.current.style.setProperty('--backdrop-opacity', fadeRatio.toString());
      }
    }
  }, []);

  const handleTouchEnd = useCallback(
    (event: TouchEvent) => {
      if (!contentRef.current) {
        return;
      }

      const deltaY = event.changedTouches[0].clientY - touchStartY.current;
      if (scrollStartY.current <= 0 && deltaY > 100) {
        requestClose();
        return;
      }

      contentRef.current.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';
      contentRef.current.style.transform = '';

      if (dialogRef.current) {
        dialogRef.current.classList.add('modal-animating');
        dialogRef.current.style.setProperty('--backdrop-opacity', '1');
        window.setTimeout(() => {
          dialogRef.current?.classList.remove('modal-animating');
        }, 300);
      }
    },
    [requestClose],
  );

  const markOpened = useCallback(() => {
    isClosingRef.current = false;
  }, []);

  return {
    dialogRef,
    contentRef,
    requestClose,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    markOpened,
  };
}
