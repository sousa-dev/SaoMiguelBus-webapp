/**
 * Which stop of a journey a rider standing somewhere should walk to.
 *
 * Pure, so the rules can be tested without a map or a GPS fix:
 *
 *   - the PLANNED boarding stops (board, and the change on a two-bus journey)
 *     always get a distance — that is the stop the times on the card are for;
 *   - a different stop on the same journey is only suggested when it saves a
 *     real walk (`CLOSER_STOP_MIN_SAVING_METRES`), so two poles on opposite
 *     sides of a road do not produce a "closer" hint that changes nothing;
 *   - the user is only pulled into the initial map framing when they are near
 *     the route at all (`INCLUDE_USER_IN_BOUNDS_METRES`), otherwise a rider
 *     checking a route from another town gets a map zoomed out to nothing.
 *
 * Mirrors `features/transit/lib/nearest-stop.ts` in the mobile app.
 */

import type { JourneyMapPin } from '@/features/transit/lib/journey-map-data';
import { distanceMetres } from '@/lib/geo';

export type UserPoint = { lat: number; lng: number };

export type StopDistance = { pin: JourneyMapPin; metres: number };

export type NearestStops = {
  /** Every board/change pin with its distance, in itinerary order. */
  boarding: StopDistance[];
  /** The closest pin of any kind on the journey. */
  nearest: StopDistance | null;
  /**
   * A stop that is meaningfully closer than the FIRST boarding stop, or null.
   * Never the boarding stop itself.
   */
  closer: (StopDistance & { savesMetres: number }) | null;
};

export const CLOSER_STOP_MIN_SAVING_METRES = 150;
export const INCLUDE_USER_IN_BOUNDS_METRES = 5000;

export function nearestStops(pins: JourneyMapPin[], user: UserPoint): NearestStops {
  const measured: StopDistance[] = pins.map((pin) => ({
    pin,
    metres: distanceMetres(user.lat, user.lng, pin.coordinate[0], pin.coordinate[1]),
  }));

  const boarding = measured.filter(({ pin }) => pin.kind === 'board' || pin.kind === 'change');

  let nearest: StopDistance | null = null;
  for (const entry of measured) {
    if (!nearest || entry.metres < nearest.metres) {
      nearest = entry;
    }
  }

  const first = boarding[0] ?? null;
  let closer: NearestStops['closer'] = null;
  if (first && nearest && nearest.pin.stopId !== first.pin.stopId) {
    const savesMetres = first.metres - nearest.metres;
    if (savesMetres >= CLOSER_STOP_MIN_SAVING_METRES) {
      closer = { ...nearest, savesMetres };
    }
  }

  return { boarding, nearest, closer };
}

export function shouldIncludeUserInBounds(result: NearestStops | null): boolean {
  return !!result?.nearest && result.nearest.metres <= INCLUDE_USER_IN_BOUNDS_METRES;
}

export { formatWalkDistance } from '@/lib/geo';
