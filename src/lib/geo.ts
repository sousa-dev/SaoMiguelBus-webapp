/** Haversine distance in kilometres. */
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const radius = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return radius * 2 * Math.asin(Math.sqrt(a));
}

export function distanceMetres(lat1: number, lng1: number, lat2: number, lng2: number): number {
  return distanceKm(lat1, lng1, lat2, lng2) * 1000;
}

export function formatDistanceKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

/**
 * "350 m" under a kilometre (to the nearest 10 m — GPS is not better than that),
 * "1,2 km" above it, in the reader's locale.
 */
export function formatWalkDistance(metres: number, locale = 'pt'): string {
  if (metres < 1000) {
    const rounded = Math.max(10, Math.round(metres / 10) * 10);
    return `${rounded} m`;
  }
  const km = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(metres / 1000);
  return `${km} km`;
}
