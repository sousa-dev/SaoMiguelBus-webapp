import type { SeismicEvent } from '@/lib/types';

type T = (key: string, opts?: Record<string, unknown>) => string;

/** Magnitude → semantic colour token name (matches lib/seismic-colors.ts thresholds). */
export function magnitudeColorVar(magnitude: number): string {
  if (magnitude >= 5) return 'var(--color-danger)';
  if (magnitude >= 3) return 'var(--color-warning)';
  return 'var(--color-success)';
}

const GENERIC_REGION = /^(AZORES(\s+REGION)?|AZORES\s+ISLAND)$/i;

const BEARING_I18N_KEYS: Record<string, string> = {
  N: 'seismicBearingN',
  NE: 'seismicBearingNE',
  E: 'seismicBearingE',
  SE: 'seismicBearingSE',
  S: 'seismicBearingS',
  SW: 'seismicBearingSW',
  W: 'seismicBearingW',
  NW: 'seismicBearingNW',
};

export function formatSeismicBearing(bearing: string, t: T): string {
  const key = BEARING_I18N_KEYS[bearing.trim().toUpperCase()];
  return key ? t(key) : bearing;
}

export function isGenericSeismicRegion(region: string | undefined | null): boolean {
  if (!region?.trim()) return true;
  return GENERIC_REGION.test(region.trim());
}

/** Headline: prefer nearest-island phrasing, else a non-generic region, else null. */
export function seismicEventHeadline(event: SeismicEvent, t: T): string | null {
  if (event.nearestIsland) {
    return t('seismicNearIsland', {
      distance: Math.round(event.nearestIsland.distanceKm),
      bearing: formatSeismicBearing(event.nearestIsland.bearing, t),
      island: event.nearestIsland.name,
    });
  }
  const region = event.region?.trim();
  if (region && !isGenericSeismicRegion(region)) {
    return region;
  }
  return null;
}

export function seismicMagnitudeLabelKey(magnitude: number): string {
  if (magnitude >= 5) return 'seismicMagStrong';
  if (magnitude >= 4) return 'seismicMagModerate';
  if (magnitude >= 3) return 'seismicMagLight';
  if (magnitude >= 2) return 'seismicMagMinor';
  return 'seismicMagMicro';
}
