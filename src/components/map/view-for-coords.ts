/**
 * Deterministically derive a center + zoom from a bounding box, WITHOUT relying on the container
 * size. Avoids Leaflet's flaky fitBounds when a map mounts below the fold or scrolled.
 */
export function viewForCoords(
  coords: [number, number][],
  fallback: { lat: number; lng: number },
  fallbackZoom: number,
): { center: [number, number]; zoom: number } {
  if (coords.length === 0) {
    return { center: [fallback.lat, fallback.lng], zoom: fallbackZoom };
  }
  const lats = coords.map((c) => c[0]);
  const lngs = coords.map((c) => c[1]);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const center: [number, number] = [(minLat + maxLat) / 2, (minLng + maxLng) / 2];
  if (coords.length === 1) {
    return { center, zoom: 13 };
  }
  const span = Math.max(maxLat - minLat, (maxLng - minLng) * Math.cos((center[0] * Math.PI) / 180));
  const zoom = span > 0.6 ? 9 : span > 0.3 ? 10 : span > 0.15 ? 11 : span > 0.07 ? 12 : span > 0.03 ? 13 : 14;
  return { center, zoom };
}
