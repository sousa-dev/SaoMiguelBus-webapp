import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { MapView, type MapLine, type MapPoint } from '@/components/MapView';
import { useTripGeometry } from '@/features/transit/hooks';
import {
  buildJourneyMapData,
  isMappable,
  type JourneyMapPin,
} from '@/features/transit/lib/journey-map-data';
import { cn } from '@/lib/cn';
import { journeyRideLegs } from '@/lib/types';
import type { TransitJourney, TransitLegGeometry } from '@/lib/types';

/**
 * Geometry for one ride leg.
 *
 * A hook per leg rather than one call for the journey, because the endpoint is
 * per-trip and journeys cap at two rides — and because MOUNTING is what fetches.
 * This component is deliberately rendered only behind an expand toggle, so a
 * page of twenty results does not fire forty geometry requests for maps nobody
 * opened.
 */
function useLegGeometries(
  journey: TransitJourney,
  enabled: boolean,
): (TransitLegGeometry | undefined)[] {
  const rides = journeyRideLegs(journey);
  const first = useTripGeometry({
    tripId: rides[0]?.tripId ?? null,
    from: rides[0]?.board.sequence,
    to: rides[0]?.alight.sequence,
    enabled: enabled && rides.length > 0,
  });
  const second = useTripGeometry({
    tripId: rides[1]?.tripId ?? null,
    from: rides[1]?.board.sequence,
    to: rides[1]?.alight.sequence,
    enabled: enabled && rides.length > 1,
  });
  return [first.data, second.data];
}

export function JourneyMap({
  journey,
  /** Omit both sequences and draw the whole trip — the trip detail page's case. */
  wholeTrip = false,
  onStopClick,
  className,
}: {
  journey: TransitJourney;
  wholeTrip?: boolean;
  onStopClick?: (pin: JourneyMapPin) => void;
  className?: string;
}) {
  const { t } = useTranslation();
  const rides = journeyRideLegs(journey);

  const wholeTripGeometry = useTripGeometry({
    tripId: wholeTrip ? (rides[0]?.tripId ?? null) : null,
    enabled: wholeTrip && rides.length > 0,
  });
  const legGeometries = useLegGeometries(journey, !wholeTrip);
  const geometries = wholeTrip ? [wholeTripGeometry.data] : legGeometries;

  const data = useMemo(
    () => buildJourneyMapData(journey, geometries),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [journey, geometries[0], geometries[1]],
  );

  if (!isMappable(data)) {
    // No road shape and nothing placeable: say so rather than showing an empty
    // map of the island, which reads as a bug.
    return (
      <p className={className}>
        <span className="text-xs text-muted">{t('transitMapUnavailable')}</span>
      </p>
    );
  }

  const lines: MapLine[] = data.lines.map((line) => ({
    id: line.id,
    coords: line.coordinates,
    color: line.color,
    weight: 5,
  }));

  const points: MapPoint[] = data.pins.map((pin) => ({
    id: pin.id,
    lat: pin.coordinate[0],
    lng: pin.coordinate[1],
    color: pin.color,
    // Only the places a rider acts are drawn large; the rest stay dots so the
    // route does not become a bead necklace.
    radius: pin.kind === 'stop' ? 4 : 8,
    popup: (
      <span className="text-xs">
        <strong>{pin.name}</strong>
        {pin.code ? ` · ${pin.code}` : ''} · {pin.time}
      </span>
    ),
    ...(onStopClick ? { onClick: () => onStopClick(pin) } : {}),
  }));

  return (
    <div
      className={cn('h-60 overflow-hidden rounded-xl border border-border', className)}
      aria-label={t('transitMapA11y')}
    >
      <MapView points={points} lines={lines} />
    </div>
  );
}
