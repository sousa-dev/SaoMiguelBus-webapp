import type { AdPlacement } from '@/features/ads/providers/types';

/** Route prefixes that always carry publisher content once their data is loaded. */
const ALLOWED_PREFIXES = [
  '/hub',
  '/transit',
  '/minibus',
  '/news',
  '/weather',
  '/earthquakes',
  '/trails',
  '/tours',
  '/traffic',
  '/marketplace',
];

/**
 * Network ads may only render on module pages. The index redirect, legal pages and unknown
 * routes never get a third-party unit (AdSense "no content" policy, and plain courtesy).
 */
export function isNetworkAdAllowedOnPath(pathname: string): boolean {
  return ALLOWED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** Slot names are free-form (`top`, `inline-3`); placements are the four layout buckets. */
export function resolvePlacement(slot: string | number | undefined): AdPlacement {
  if (slot === undefined) return 'top';
  const name = String(slot);
  if (name === 'top' || name === 'sidebar' || name === 'footer') return name;
  return 'inline';
}
