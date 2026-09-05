import { useEffect, useState, type RefObject } from 'react';

/**
 * `true` once the element is within `rootMargin` of the viewport (and stays true). Used to defer
 * inline ad requests until the user scrolls near them. Disabled or unsupported → `true` at once.
 */
export function useNearViewport(
  ref: RefObject<Element | null>,
  options: { enabled: boolean; rootMargin?: string },
): boolean {
  const { enabled, rootMargin = '600px' } = options;
  const supported = typeof IntersectionObserver !== 'undefined';
  const [near, setNear] = useState(!enabled || !supported);

  useEffect(() => {
    if (near || !enabled || !supported) return;
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [enabled, near, ref, rootMargin, supported]);

  return near;
}
