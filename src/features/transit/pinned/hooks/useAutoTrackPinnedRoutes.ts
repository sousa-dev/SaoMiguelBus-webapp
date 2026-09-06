/**
 * Pinned routes that start following themselves when their time comes. Ported from the Expo
 * `useAutoTrackPinnedRoutes`: runs on page load, when bootstrap resolves, and whenever the tab
 * becomes visible again (the web analog of a foreground). No background execution, no push.
 *
 * Cheap by design: `pinsDueNow` rules out every pin whose hour has not come from its own stored
 * times, and only the survivors are confirmed against the real timetable. Deliberately silent —
 * failures are logged and the widget simply stays as it was.
 */
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';

import { usePremium } from '@/features/premium/usePremium';
import {
  fetchJourneySearchResult,
  journeySearchQueryKey,
  type JourneySearchKey,
} from '@/features/transit/hooks';
import {
  AUTO_TRACK_SLOT_RESERVE,
  pinsDueNow,
  planAutoTracks,
} from '@/features/transit/pinned/pinned-follow';
import { useScheduleConfig, useTransitDataset } from '@/features/transit/schedule-hooks';
import { MAX_ACTIVE_TRACKS, localIsoDate } from '@/features/transit/tracking/bus-tracking';
import { journeyTrackPayload } from '@/features/transit/tracking/journey-legs';
import { useTrackingStore } from '@/features/transit/tracking/tracking-store';
import type { PinnedRoute } from '@/features/transit/tracking/tracking-types';
import { useBootstrap } from '@/hooks/useBootstrap';
import { FULL_DAY_START, displayRouteNumber, resolveDayType } from '@/lib/format';
import { getNetworkOnline } from '@/lib/network-online';
import type { TransitJourney } from '@/lib/types';

/** Pins can hold a change of bus, so the search has to allow one. */
const AUTO_TRACK_MAX_TRANSFERS = 1;
/** Floor between sweeps: tab-switching back and forth must not re-run the search each time. */
export const MIN_SWEEP_INTERVAL_MS = 60_000;

export function useAutoTrackPinnedRoutes() {
  const isPremium = usePremium();
  // A countdown must not run against a timetable that is not in force.
  const { canTrackTrips } = useScheduleConfig();
  const dataset = useTransitDataset();
  const bootstrap = useBootstrap();
  const queryClient = useQueryClient();
  // The raw store actions, not `useBusTracking`: that hook runs a 30-second tick.
  const startTracking = useTrackingStore((s) => s.startTracking);
  const markAutoTracked = useTrackingStore((s) => s.markAutoTracked);

  const running = useRef(false);
  const lastSweepAt = useRef(0);
  // Read through a ref so a late-arriving holiday list does not rebuild `sweep`.
  const holidaysRef = useRef(bootstrap.data?.holidays);
  useEffect(() => {
    holidaysRef.current = bootstrap.data?.holidays;
  }, [bootstrap.data?.holidays]);

  const sweep = useCallback(async () => {
    if (!isPremium || !canTrackTrips || running.current || !getNetworkOnline()) return;
    const startedAt = Date.now();
    if (startedAt - lastSweepAt.current < MIN_SWEEP_INTERVAL_MS) return;

    const { pinned, active, autoTracked } = useTrackingStore.getState();
    const now = new Date();
    const today = localIsoDate(now);
    const armed = autoTracked ?? {};
    const alreadyArmed = (pin: PinnedRoute) => armed[`${pin.id}|${today}`] != null;

    // One slot is held back so a rider is never refused a manual track because the sweep
    // spent every one.
    const slots = MAX_ACTIVE_TRACKS - AUTO_TRACK_SLOT_RESERVE - active.length;
    if (slots <= 0) return;

    const due = pinsDueNow(pinned, today, now, { alreadyArmed });
    if (due.length === 0) return;

    running.current = true;
    lastSweepAt.current = startedAt;
    try {
      const dayType = resolveDayType(now, holidaysRef.current);

      // Pins sharing an origin and destination share one request.
      const pairKey = (pin: PinnedRoute) => `${pin.origin} -> ${pin.destination}`;
      const pairs = new Map<string, { origin: string; destination: string }>();
      for (const pin of due) {
        pairs.set(pairKey(pin), { origin: pin.origin, destination: pin.destination });
      }

      const answers = new Map<string, TransitJourney[]>();
      await Promise.all(
        [...pairs].map(async ([key, pair]) => {
          const params: JourneySearchKey = {
            origin: pair.origin,
            destination: pair.destination,
            day: dayType,
            start: FULL_DAY_START,
            maxTransfers: AUTO_TRACK_MAX_TRANSFERS,
            dataset,
          };
          const result = await queryClient.fetchQuery({
            queryKey: journeySearchQueryKey(params),
            queryFn: () => fetchJourneySearchResult({ ...params, source: 'auto_track' }),
          });
          answers.set(key, result.journeys);
        }),
      );

      const plan = planAutoTracks({
        pins: due,
        journeysFor: (pin) => answers.get(pairKey(pin)) ?? [],
        today,
        dayType,
        now,
        slots,
        alreadyArmed,
      });

      for (const { pin, journey } of plan) {
        startTracking(journeyTrackPayload(journey, dayType, dataset, displayRouteNumber, { auto: true }));
        // Marked whatever the store answered: re-arming a track the rider just dismissed is the
        // failure this guards against.
        markAutoTracked(pin.id, today);
      }
    } catch (error) {
      console.warn(`auto-tracking pinned routes failed: ${String(error)}`);
    } finally {
      running.current = false;
    }
  }, [isPremium, canTrackTrips, dataset, queryClient, startTracking, markAutoTracked]);

  // Page load, and again once bootstrap decides the day type and dataset.
  useEffect(() => {
    void sweep();
  }, [sweep, bootstrap.isSuccess]);

  // The tab coming back into view is the web's "foreground".
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const onVisible = () => {
      if (document.visibilityState === 'visible') void sweep();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [sweep]);
}
