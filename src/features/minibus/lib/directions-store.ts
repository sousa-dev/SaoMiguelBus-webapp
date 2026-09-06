import type { MinibusJourney } from '@/lib/types';

/**
 * A write-once/read-once mailbox from the search results to `/minibus/directions` —
 * mirrors the mobile app's handoff exactly. A direct link or refresh of the
 * directions page finds nothing pending, same as mobile.
 */
let pending: MinibusJourney | null = null;

export function setPendingDirections(journey: MinibusJourney): void {
  pending = journey;
}

export function consumePendingDirections(): MinibusJourney | null {
  const value = pending;
  pending = null;
  return value;
}
