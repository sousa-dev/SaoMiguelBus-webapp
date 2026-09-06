import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { MapView, type MapLine, type MapPoint } from '@/components/MapView';
import { journeyHasMapCoordinates, journeyPolylines } from '@/features/minibus/lib/journey-map';
import {
  buildJourneySteps,
  journeyMapMarkers,
  resolveJourneyMapMarker,
} from '@/features/minibus/lib/journeySteps';
import type { MinibusJourney } from '@/lib/types';

/** The directions map: one polyline per leg, one numbered pin per board/transfer/alight stop. */
export function MinibusJourneyMap({
  journey,
  highlightedStepKey,
}: {
  journey: MinibusJourney;
  highlightedStepKey: string | null;
}) {
  const { t } = useTranslation();

  const steps = useMemo(() => buildJourneySteps(journey, t), [journey, t]);
  const markers = useMemo(() => journeyMapMarkers(steps), [steps]);
  const lines: MapLine[] = useMemo(
    () =>
      journeyPolylines(journey).map((line) => ({
        id: line.id,
        color: line.color,
        weight: 5,
        coords: line.coordinates.map((c) => [c.latitude, c.longitude] as [number, number]),
      })),
    [journey],
  );

  const focusMarker = highlightedStepKey ? resolveJourneyMapMarker(markers, steps, highlightedStepKey) : null;

  if (!journeyHasMapCoordinates(journey) || markers.length === 0) {
    return null;
  }

  const points: MapPoint[] = markers.map((marker) => {
    const isFocused = focusMarker?.id === marker.id;
    return {
      id: marker.id,
      lat: marker.coordinate.latitude,
      lng: marker.coordinate.longitude,
      color: marker.color,
      radius: isFocused ? 12 : 8,
      popup: (
        <span className="text-xs">
          {marker.stepNumber}. {marker.title}
        </span>
      ),
    };
  });

  return (
    <div className="h-72 overflow-hidden rounded-2xl border border-border" aria-label={t('minibusJourneyMapA11y')}>
      <MapView
        points={points}
        lines={lines}
        focus={focusMarker ? { lat: focusMarker.coordinate.latitude, lng: focusMarker.coordinate.longitude } : null}
      />
    </div>
  );
}
