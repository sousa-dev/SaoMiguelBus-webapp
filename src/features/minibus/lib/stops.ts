import type { MinibusNetwork, MinibusNetworkStop, MinibusStopRef } from '@/lib/types';

export type MapCoordinate = { latitude: number; longitude: number };

export function hasCoordinates(stop: Pick<MinibusNetworkStop, 'latitude' | 'longitude'> | MinibusStopRef): boolean {
  return typeof stop.latitude === 'number' && typeof stop.longitude === 'number';
}

export function stopCoordinate(
  stop: Pick<MinibusNetworkStop, 'latitude' | 'longitude'> | MinibusStopRef,
): MapCoordinate | null {
  if (!hasCoordinates(stop)) {
    return null;
  }
  return { latitude: stop.latitude as number, longitude: stop.longitude as number };
}

function orderedStops(stops: MinibusNetworkStop[]): MinibusNetworkStop[] {
  return [...stops].sort((a, b) => a.sequence - b.sequence);
}

export function coordinatesMatch(a: MapCoordinate, b: MapCoordinate): boolean {
  const epsilon = 1e-5;
  return Math.abs(a.latitude - b.latitude) < epsilon && Math.abs(a.longitude - b.longitude) < epsilon;
}

function stopsCoordinatesMatch(a: MinibusNetworkStop, b: MinibusNetworkStop): boolean {
  const coordA = stopCoordinate(a);
  const coordB = stopCoordinate(b);
  return coordA != null && coordB != null && coordinatesMatch(coordA, coordB);
}

/**
 * Every Mini Bus line is circular — the last stop in the schematic shares
 * coordinates with the first (the loop return). Treat it as the same physical
 * place rather than an extra numbered stop.
 */
export function isLoopTerminus(stop: MinibusNetworkStop, stops: MinibusNetworkStop[]): boolean {
  const ordered = orderedStops(stops);
  const last = ordered[ordered.length - 1];
  const first = ordered[0];
  if (!last || !first || last.key !== stop.key) {
    return false;
  }
  return stopsCoordinatesMatch(first, last);
}

/** Show sequence 1 on the loop-return stop instead of the schematic's last number. */
export function displayStopSequence(stop: MinibusNetworkStop, stops: MinibusNetworkStop[]): number {
  return isLoopTerminus(stop, stops) ? 1 : stop.sequence;
}

/** One map pin per physical location — the loop-return duplicate is dropped. */
export function lineMapStops(stops: MinibusNetworkStop[]): MinibusNetworkStop[] {
  const ordered = orderedStops(stops);
  if (ordered.length < 2 || !isLoopTerminus(ordered[ordered.length - 1], ordered)) {
    return ordered;
  }
  return ordered.slice(0, -1);
}

/** Deduped, sorted stop names across every line — feeds the route planner autocomplete. */
export function networkStopNames(network: MinibusNetwork | null | undefined): string[] {
  if (!network) {
    return [];
  }
  const seen = new Set<string>();
  const names: string[] = [];
  for (const line of network.lines) {
    for (const stop of line.stops) {
      if (!seen.has(stop.name_pt)) {
        seen.add(stop.name_pt);
        names.push(stop.name_pt);
      }
    }
  }
  return names.sort((a, b) => a.localeCompare(b));
}
