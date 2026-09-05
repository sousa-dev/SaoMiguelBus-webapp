import type { MapLine, MapPoint } from '@/components/MapView';
import { decodePolyline } from '@/lib/polyline';
import type { MinibusNetworkStop, MinibusRouteShape } from '@/lib/types';

import { lineMapStops } from './stops';

/**
 * Prefer the operator's own AVL-captured route geometry (follows the actual
 * road); the schematic only carries straight-line stop-to-stop segments.
 */
export function minibusLineRoute(
  color: string,
  routeShapes: MinibusRouteShape[] | null | undefined,
): MapLine[] {
  const preferred =
    routeShapes?.find((shape) => shape.direction === 0) ??
    routeShapes?.find((shape) => typeof shape.encoded_polyline === 'string') ??
    null;
  if (!preferred?.encoded_polyline) {
    return [];
  }
  const decoded = decodePolyline(preferred.encoded_polyline);
  // A decode of a corrupt/empty string can yield degenerate points near (0, 0);
  // never draw those as a route.
  const plausible = decoded.every((coord) => Math.abs(coord[0]) > 1 && Math.abs(coord[1]) > 1);
  if (!plausible || decoded.length < 2) {
    return [];
  }
  return [{ id: 'route', coords: decoded, color, weight: 5 }];
}

export function minibusStopPins(
  stops: MinibusNetworkStop[],
  onStopClick?: (stopKey: string) => void,
): MapPoint[] {
  return lineMapStops(stops)
    .filter((stop) => typeof stop.latitude === 'number' && typeof stop.longitude === 'number')
    .map((stop) => ({
      id: stop.key,
      lat: stop.latitude as number,
      lng: stop.longitude as number,
      radius: 5,
      popup: stop.name_pt,
      onClick: onStopClick ? () => onStopClick(stop.key) : undefined,
    }));
}
