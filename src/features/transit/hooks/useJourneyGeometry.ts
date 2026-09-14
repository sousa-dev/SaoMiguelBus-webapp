import { useTripGeometry } from '@/features/transit/hooks';
import { journeyRideLegs } from '@/lib/types';
import type { TransitJourney, TransitLegGeometry } from '@/lib/types';

/**
 * Road geometry for every ride leg of a journey (max two, per the itinerary
 * cap). A hook per leg rather than one call for the journey, because the
 * endpoint is per-trip.
 *
 * `enabled` gates the fetch — callers only want this to fire once the map is
 * actually mounted, so a page of results does not fire a request per journey.
 */
export function useJourneyGeometry(
  journey: TransitJourney | null,
  enabled = true,
): { geometries: (TransitLegGeometry | undefined)[]; isLoading: boolean } {
  const rides = journey ? journeyRideLegs(journey) : [];
  const first = useTripGeometry({
    tripId: rides[0]?.tripId ?? null,
    from: rides[0]?.board.sequence,
    to: rides[0]?.alight.sequence,
    enabled: enabled && rides.length > 0,
  });
  const second = useTripGeometry({
    tripId: rides[1]?.tripId ?? null,
    from: rides[1]?.board.sequence,
    to: rides[1]?.alight.sequence,
    enabled: enabled && rides.length > 1,
  });
  return {
    geometries: [first.data, second.data],
    isLoading: first.isLoading || second.isLoading,
  };
}
