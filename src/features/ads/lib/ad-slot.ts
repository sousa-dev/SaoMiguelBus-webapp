import type { AdPayload } from '@/lib/types';

/** Web waterfall: first-party API → internal fallback (no AdMob). */
export type AdSlotKind = 'first-party' | 'internal' | null;

export function resolveAdSlotKind(input: {
  enabled: boolean;
  firstParty: AdPayload | null | undefined;
  fetched: boolean;
}): AdSlotKind {
  if (!input.enabled) {
    return null;
  }
  if (input.firstParty) {
    return 'first-party';
  }
  if (input.fetched) {
    return 'internal';
  }
  return null;
}
