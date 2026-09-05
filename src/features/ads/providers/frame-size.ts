import type { AdUnitSize } from '@/features/ads/providers/types';

/** Standard horizontal display sizes, widest first. Heights stay under 100px so slots feel like banners. */
const HORIZONTAL_SIZES: readonly AdUnitSize[] = [
  { width: 728, height: 90 },
  { width: 468, height: 60 },
  { width: 320, height: 100 },
];

const SMALLEST: AdUnitSize = { width: 320, height: 50 };

/** Largest standard unit that fits `containerWidth`; the mobile banner when nothing fits. */
export function pickHorizontalSize(containerWidth: number): AdUnitSize {
  const fit = HORIZONTAL_SIZES.find((size) => size.width <= containerWidth);
  return fit ? { ...fit } : { ...SMALLEST };
}
