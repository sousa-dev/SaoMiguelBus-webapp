/**
 * Turning a journey plus its fetched geometry into things a map can draw.
 *
 * Pure — no map, no network, no React — so the rules that matter can be tested
 * directly: that a leg with no road shape draws no line rather than a straight
 * one, that the pins are the places a rider acts (board, change, alight) rather
 * than every stop, and that a journey we cannot place produces nothing at all.
 *
 * The straight-line question is the important one. On the legacy network a
 * stop-to-stop line jumps 12.9 km from Vila Franca to Furnas, straight through
 * the caldera, because legacy has 108 village-level stops and no road geometry.
 * We do not draw that. No shape means no line, and no map is offered.
 *
 * Coordinates are `[lat, lng]` tuples throughout, which is what `MapView`'s
 * `MapLine.coords` and `decodePolyline` already speak.
 */

import { decodePolyline } from '@/lib/polyline';
import { journeyRideLegs } from '@/lib/types';
import type { TransitJourney, TransitLegGeometry } from '@/lib/types';

export type LatLng = [number, number];

/** Where a rider does something, as opposed to a stop the bus merely passes. */
export type JourneyPinKind = 'board' | 'change' | 'alight' | 'stop';

export interface JourneyMapPin {
  id: string;
  kind: JourneyPinKind;
  /** Which ride leg this stop belongs to — 0-based over the RIDE legs only. */
  legIndex: number;
  stopId: number;
  name: string;
  time: string;
  code?: string;
  coordinate: LatLng;
  /** 1-based position in the itinerary, shown inside the pin. */
  step: number;
  color: string;
}

export interface JourneyMapLine {
  id: string;
  tripId: number;
  route: string;
  coordinates: LatLng[];
  color: string;
}

export interface JourneyMapData {
  lines: JourneyMapLine[];
  pins: JourneyMapPin[];
  /** True when at least one leg has a real road path. */
  hasShape: boolean;
}

/**
 * Per-leg colours. Two legs of one journey must not look like one bus, and the
 * change is the thing the rider most needs to see coming.
 */
export const LEG_COLORS = ['#1e88e5', '#00897b', '#8e24aa'];
export const CHANGE_COLOR = '#6366f1';

export function legColor(index: number): string {
  return LEG_COLORS[index % LEG_COLORS.length];
}

/**
 * Reject Null Island and non-finite values.
 *
 * Two stops with missing coordinates both land on (0, 0), measure 0 m apart, and
 * would draw a journey through the Gulf of Guinea.
 */
function coordinateOf(stop: { lat?: number; lon?: number }): LatLng | null {
  if (
    typeof stop.lat !== 'number' ||
    typeof stop.lon !== 'number' ||
    !Number.isFinite(stop.lat) ||
    !Number.isFinite(stop.lon) ||
    (stop.lat === 0 && stop.lon === 0)
  ) {
    return null;
  }
  return [stop.lat, stop.lon];
}

/**
 * Build the map for a journey from the geometry fetched for each of its legs.
 *
 * `geometries` is indexed the same way as the journey's RIDE legs — entry `i`
 * belongs to ride leg `i`. A missing or still-loading entry contributes nothing
 * rather than a placeholder.
 */
export function buildJourneyMapData(
  journey: TransitJourney,
  geometries: (TransitLegGeometry | undefined)[],
): JourneyMapData {
  const rides = journeyRideLegs(journey);
  const lines: JourneyMapLine[] = [];
  const pins: JourneyMapPin[] = [];
  let step = 0;

  // Placed stops for every leg up front, because classifying a leg's LAST stop
  // needs to know where the NEXT leg starts.
  const placedByLeg = rides.map((_, index) => {
    const geometry = geometries[index];
    if (!geometry) {
      return [] as { stop: TransitLegGeometry['stops'][number]; coordinate: LatLng }[];
    }
    return geometry.stops
      .map((stop) => ({ stop, coordinate: coordinateOf(stop) }))
      .filter(
        (entry): entry is { stop: TransitLegGeometry['stops'][number]; coordinate: LatLng } =>
          entry.coordinate !== null,
      );
  });

  rides.forEach((_ride, index) => {
    const geometry = geometries[index];
    if (!geometry) {
      return;
    }

    const color = legColor(index);

    // No shape means no line. Never a straight one — see the module note.
    const points = decodePolyline(geometry.shape);
    if (points.length > 1) {
      lines.push({
        id: `leg-${index}-${geometry.tripId}`,
        tripId: geometry.tripId,
        route: geometry.route,
        coordinates: points,
        color,
      });
    }

    const placed = placedByLeg[index];
    const isLastLeg = index === rides.length - 1;
    const nextBoarding = placedByLeg[index + 1]?.[0]?.stop.stopId;

    placed.forEach(({ stop, coordinate }, position) => {
      const isFirst = position === 0;
      const isLast = position === placed.length - 1;

      let kind: JourneyPinKind = 'stop';
      if (isFirst) {
        kind = index === 0 ? 'board' : 'change';
      } else if (isLast) {
        if (isLastLeg) {
          kind = 'alight';
        } else if (stop.stopId === nextBoarding) {
          // The rider gets off and back on at the SAME place. The next leg's
          // `change` pin already says so, and emitting this too would stack two
          // markers on one spot and bury "get off here" inside the collapsed
          // group of stops the bus merely passes.
          return;
        } else {
          // A change that involves a walk: getting off HERE is its own decision,
          // separate from boarding over there, so it earns its own numbered pin.
          kind = 'alight';
        }
      }

      // Only the places a rider acts get a numbered pin; the stops in between
      // are still tappable but must not turn the route into a bead necklace.
      if (kind !== 'stop') {
        step += 1;
      }

      pins.push({
        id: `pin-${index}-${stop.stopId}-${stop.sequence}`,
        kind,
        legIndex: index,
        stopId: stop.stopId,
        name: stop.name,
        time: stop.time,
        ...(stop.code ? { code: stop.code } : {}),
        coordinate,
        step,
        color: kind === 'change' ? CHANGE_COLOR : color,
      });
    });
  });

  return { lines, pins, hasShape: lines.length > 0 };
}

/**
 * Is there enough here to be worth showing a map at all?
 *
 * A road path, or at least two placeable stops. One lone pin is not a route, and
 * a map of it tells a rider nothing they did not already read on the card.
 */
export function isMappable(data: JourneyMapData): boolean {
  return data.hasShape || data.pins.length > 1;
}

/** The pins a rider acts on, for the step list beside the map. */
export function actionPins(data: JourneyMapData): JourneyMapPin[] {
  return data.pins.filter((pin) => pin.kind !== 'stop');
}
