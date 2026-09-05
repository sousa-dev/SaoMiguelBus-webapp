import { useEffect, type RefObject } from 'react';

/**
 * Network creatives live in cross-origin iframes, so their clicks are invisible to us. The usual
 * approximation: the window loses focus while the pointer (or a touch) is over the frame. Nothing
 * is attached to the ad itself; this only listens on our wrapper and on `window`.
 */
export function useFrameClickHeuristic(
  ref: RefObject<HTMLElement | null>,
  onClick: () => void,
): void {
  useEffect(() => {
    const frame = ref.current;
    if (!frame || typeof window === 'undefined') return;

    let hovering = false;
    let reported = false;

    const enter = () => {
      hovering = true;
    };
    const leave = () => {
      hovering = false;
      reported = false;
    };
    const blur = () => {
      if (hovering && !reported) {
        reported = true;
        onClick();
      }
    };

    frame.addEventListener('pointerenter', enter);
    frame.addEventListener('touchstart', enter, { passive: true });
    frame.addEventListener('pointerleave', leave);
    window.addEventListener('blur', blur);
    return () => {
      frame.removeEventListener('pointerenter', enter);
      frame.removeEventListener('touchstart', enter);
      frame.removeEventListener('pointerleave', leave);
      window.removeEventListener('blur', blur);
    };
  }, [onClick, ref]);
}
