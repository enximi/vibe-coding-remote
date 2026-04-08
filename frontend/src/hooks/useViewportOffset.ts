import { useEffect } from 'react';

export function useViewportOffset() {
  useEffect(() => {
    if (!window.visualViewport) return;

    const updateKeyboardOffset = () => {
      const vp = window.visualViewport;
      if (!vp) return;
      const gap = window.innerHeight - (vp.height + vp.offsetTop);
      document.documentElement.style.setProperty('--keyboard-offset', `${Math.max(0, gap)}px`);
    };

    updateKeyboardOffset();
    window.visualViewport.addEventListener('resize', updateKeyboardOffset);
    window.visualViewport.addEventListener('scroll', updateKeyboardOffset);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateKeyboardOffset);
        window.visualViewport.removeEventListener('scroll', updateKeyboardOffset);
      }
    };
  }, []);
}
