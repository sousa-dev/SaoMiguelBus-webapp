// Ported from SaoMiguelBus/features/transit/hooks/useBusTracking.ts.
import { useEffect, useMemo, useState } from 'react';

import { useResolvedTransitDataset } from '@/features/transit/schedule-hooks';
import {
  MAX_ACTIVE_TRACKS,
  buildActiveTrackFromTrip,
  computeBusStatus,
  computeJourneyStatus,
  deriveTrackExpiry,
} from '@/features/transit/tracking/bus-tracking';
import { journeyAsPinnedRoute, journeyTrackPayload } from '@/features/transit/tracking/journey-legs';
import { useTrackingStore } from '@/features/transit/tracking/tracking-store';
import { displayRouteNumber } from '@/lib/format';
import type { TransitJourney, TransitSearchResult } from '@/lib/types';

/** Countdowns refresh on this tick; expired tracks are pruned on the same beat. */
export const TRACKING_TICK_MS = 30_000;

export function useBusTracking() {
  const active = useTrackingStore((s) => s.active);
  const pinned = useTrackingStore((s) => s.pinned);
  const startTracking = useTrackingStore((s) => s.startTracking);
  const stopTracking = useTrackingStore((s) => s.stopTracking);
  const pinRoute = useTrackingStore((s) => s.pinRoute);
  const unpinRoute = useTrackingStore((s) => s.unpinRoute);
  const pruneTracking = useTrackingStore((s) => s.pruneTracking);
  // Which network the countdowns were built against; a track from the other one is wrong the
  // instant the network changes.
  const dataset = useResolvedTransitDataset();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    pruneTracking(Date.now(), dataset);
    const id = setInterval(() => {
      pruneTracking(Date.now(), dataset);
      setTick((n) => n + 1);
    }, TRACKING_TICK_MS);
    return () => clearInterval(id);
  }, [pruneTracking, dataset]);

  const activeViews = useMemo(
    () =>
      active.map((track) => ({
        track,
        status: computeBusStatus(track),
        journey: computeJourneyStatus(track),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tick drives refresh
    [active, tick],
  );

  const canStartMore = active.length < MAX_ACTIVE_TRACKS;

  const startFromTrip = (trip: TransitSearchResult, searchDay: string) => {
    const payload = buildActiveTrackFromTrip(trip, searchDay);
    return startTracking({
      ...payload,
      ...(dataset ? { dataset } : {}),
      expiresAt: deriveTrackExpiry(payload.legs, payload.searchDate),
    });
  };

  const startFromJourney = (journey: TransitJourney, searchDay: string, options?: { auto?: boolean }) =>
    startTracking(journeyTrackPayload(journey, searchDay, dataset, displayRouteNumber, options));

  const pinFromJourney = (journey: TransitJourney, searchDay: string) =>
    pinRoute(journeyAsPinnedRoute(journey, searchDay, dataset, displayRouteNumber));

  const isTrackingJourney = (journeyId: string) => active.some((t) => t.journeyId === journeyId);
  const isPinnedJourney = (journeyId: string) => pinned.some((p) => p.journeyId === journeyId);
  const activeJourneyId = (journeyId: string) => active.find((t) => t.journeyId === journeyId)?.id;

  return {
    active: activeViews,
    pinned,
    canStartMore,
    startFromTrip,
    stopTracking,
    startFromJourney,
    pinFromJourney,
    unpinRoute,
    isTrackingJourney,
    isPinnedJourney,
    activeJourneyId,
  };
}
