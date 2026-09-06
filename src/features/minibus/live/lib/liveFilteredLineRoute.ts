import { hasCoordinates, lineMapStops } from '@/features/minibus/lib/stops';
import { decodePolyline } from '@/lib/polyline';
import type { MinibusNetworkLine, MinibusRouteShape } from '@/lib/types';

function routeShapeCoordinates(routeShapes: MinibusRouteShape[] | null | undefined): [number, number][] {
  const preferred =
    routeShapes?.find((shape) => shape.direction === 0) ??
    routeShapes?.find((shape) => typeof shape.encoded_polyline === 'string') ??
    null;
  if (!preferred?.encoded_polyline) {
    return [];
  }
  const decoded = decodePolyline(preferred.encoded_polyline);
  const plausible = decoded.every((coord) => Math.abs(coord[0]) > 1 && Math.abs(coord[1]) > 1);
  return plausible && decoded.length >= 2 ? decoded : [];
}

/**
 * The route to highlight for a line filter with no vehicle selected — prefers the
 * operator's AVL-captured geometry, falls back to straight stop-to-stop segments
 * (loop-safe, via `lineMapStops`) when no shape is available.
 */
export function liveFilteredLineRoute(
  networkLine: MinibusNetworkLine | null | undefined,
  routeShapes: MinibusRouteShape[] | null | undefined,
): [number, number][] | undefined {
  const fromShape = routeShapeCoordinates(routeShapes);
  if (fromShape.length > 1) {
    return fromShape;
  }
  if (!networkLine) {
    return undefined;
  }
  const stops = lineMapStops(networkLine.stops).filter(hasCoordinates);
  if (stops.length < 2) {
    return undefined;
  }
  return stops.map((stop) => [stop.latitude as number, stop.longitude as number]);
}
