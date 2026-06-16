import type { AdPayload } from '@/lib/types';

export function resolveAdHref(ad: AdPayload): string | null {
  if (!ad.target) {
    return null;
  }
  if (ad.action === 'directions') {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(ad.target)}`;
  }
  return ad.target;
}
