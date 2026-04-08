import { useEffect } from 'react';

export function useViewportOffset() {
  useEffect(() => {
    if (!window.visualViewport) {
      return;
    }

    const updateKeyboardOffset = () => {
      const viewport = window.visualViewport;
      if (!viewport) {
        return;
      }

      const gap = window.innerHeight - (viewport.height + viewport.offsetTop);
      document.documentElement.style.setProperty('--keyboard-offset', `${Math.max(0, gap)}px`);
    };

    updateKeyboardOffset();
    window.visualViewport.addEventListener('resize', updateKeyboardOffset);
    window.visualViewport.addEventListener('scroll', updateKeyboardOffset);

    return () => {
      document.documentElement.style.setProperty('--keyboard-offset', '0px');
      window.visualViewport?.removeEventListener('resize', updateKeyboardOffset);
      window.visualViewport?.removeEventListener('scroll', updateKeyboardOffset);
    };
  }, []);
}
