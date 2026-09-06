import { stopCoordinate, type MapCoordinate } from '@/features/minibus/lib/stops';
import type { MinibusJourney, MinibusLeg } from '@/lib/types';

/**
 * The directions map draws straight stop-to-stop segments through each leg's
 * own stop refs, not the AVL road-following shapes `MinibusLinePage` prefers —
 * matching the mobile app exactly, deliberately, not by omission.
 */
export function legPolyline(leg: MinibusLeg): MapCoordinate[] {
  return leg.stops.map((stop) => stopCoordinate(stop)).filter((coord): coord is MapCoordinate => coord !== null);
}

export type JourneyPolyline = {
  id: string;
  color: string;
  coordinates: MapCoordinate[];
};

export function journeyPolylines(journey: MinibusJourney): JourneyPolyline[] {
  return journey.legs
    .map((leg, index) => ({
      id: `${leg.line_code}-${leg.board.key}-${index}`,
      color: leg.line_color ?? '#2563eb',
      coordinates: legPolyline(leg),
    }))
    .filter((line) => line.coordinates.length > 0);
}

export function journeyHasMapCoordinates(journey: MinibusJourney): boolean {
  return journeyPolylines(journey).some((line) => line.coordinates.length > 0);
}
