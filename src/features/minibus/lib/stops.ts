import type { MinibusNetwork, MinibusNetworkStop } from '@/lib/types';

function orderedStops(stops: MinibusNetworkStop[]): MinibusNetworkStop[] {
  return [...stops].sort((a, b) => a.sequence - b.sequence);
}

function coordinatesMatch(a: MinibusNetworkStop, b: MinibusNetworkStop): boolean {
  if (
    typeof a.latitude !== 'number' ||
    typeof a.longitude !== 'number' ||
    typeof b.latitude !== 'number' ||
    typeof b.longitude !== 'number'
  ) {
    return false;
  }
  const epsilon = 1e-5;
  return Math.abs(a.latitude - b.latitude) < epsilon && Math.abs(a.longitude - b.longitude) < epsilon;
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
  return coordinatesMatch(first, last);
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
