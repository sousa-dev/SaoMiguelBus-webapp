import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { MapView, type MapLine, type MapPoint } from '@/components/MapView';
import { useTripGeometry } from '@/features/transit/hooks';
import { useJourneyGeometry } from '@/features/transit/hooks/useJourneyGeometry';
import {
  buildJourneyMapData,
  isMappable,
  type JourneyMapData,
  type JourneyMapPin,
} from '@/features/transit/lib/journey-map-data';
import { shouldIncludeUserInBounds, nearestStops } from '@/features/transit/lib/nearest-stop';
import { cn } from '@/lib/cn';
import { journeyRideLegs } from '@/lib/types';
import type { TransitJourney } from '@/lib/types';

export function JourneyMap({
  journey,
  /** Omit both sequences and draw the whole trip — the trip detail page's case. */
  wholeTrip = false,
  onStopClick,
  className,
  highlightedStopId = null,
  userLocation = null,
  onRequestLocation,
  showLocateControl = false,
  showZoomControl = true,
  onData,
}: {
  journey: TransitJourney;
  wholeTrip?: boolean;
  onStopClick?: (pin: JourneyMapPin) => void;
  className?: string;
  highlightedStopId?: number | null;
  /** The viewer's own position, when known — draws the blue dot. */
  userLocation?: { lat: number; lng: number } | null;
  /** No fix yet: clicking the (still-shown) locate control asks for one. */
  onRequestLocation?: () => void;
  showLocateControl?: boolean;
  /** Off for the card's preview map, where zooming is not the point. */
  showZoomControl?: boolean;
  /** Reports the built pins/lines once geometry resolves, for a caller
   *  outside the map (e.g. the card's "nearest boarding stop" line) that
   *  needs the same pins without fetching geometry again. */
  onData?: (data: JourneyMapData) => void;
}) {
  const { t } = useTranslation();
  const rides = journeyRideLegs(journey);

  const wholeTripGeometry = useTripGeometry({
    tripId: wholeTrip ? (rides[0]?.tripId ?? null) : null,
    enabled: wholeTrip && rides.length > 0,
  });
  const { geometries: legGeometries } = useJourneyGeometry(journey, !wholeTrip);
  const geometries = wholeTrip ? [wholeTripGeometry.data] : legGeometries;

  const data = useMemo(
    () => buildJourneyMapData(journey, geometries),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [journey, geometries[0], geometries[1]],
  );
  useEffect(() => {
    onData?.(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const extraFitCoords = useMemo((): [number, number][] => {
    if (!userLocation) return [];
    return shouldIncludeUserInBounds(nearestStops(data.pins, userLocation))
      ? [[userLocation.lat, userLocation.lng]]
      : [];
  }, [data.pins, userLocation]);

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
    // route does not become a bead necklace. A highlighted stop (the closer-
    // stop hint, or a tapped row) is drawn largest of all.
    radius: pin.stopId === highlightedStopId ? 11 : pin.kind === 'stop' ? 4 : 8,
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
      <MapView
        points={points}
        lines={lines}
        userLocation={userLocation}
        onRequestLocation={onRequestLocation}
        showLocateControl={showLocateControl}
        showZoomControl={showZoomControl}
        extraFitCoords={extraFitCoords}
      />
    </div>
  );
}
