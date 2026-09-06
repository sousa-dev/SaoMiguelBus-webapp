/**
 * "Track journey" on a pin — turn a pinned itinerary into a live track. Ported from the Expo
 * `useFollowPinnedRoute`: a pin's trip ids roll overnight, so following one means re-running
 * the search (one whole-day request per service-day type, shared with the search cache) and
 * picking the pinned run out of today's answers.
 */
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  fetchJourneySearchResult,
  journeySearchQueryKey,
  type JourneySearchKey,
} from '@/features/transit/hooks';
import {
  nextServiceDays,
  resolvePinnedFollow,
  type FollowDay,
} from '@/features/transit/pinned/pinned-follow';
import { useTransitDataset } from '@/features/transit/schedule-hooks';
import { useBusTracking } from '@/features/transit/tracking/hooks/useBusTracking';
import type { PinnedRoute } from '@/features/transit/tracking/tracking-types';
import { useBootstrap } from '@/hooks/useBootstrap';
import { FULL_DAY_START, formatWeekdayDate, type DayType } from '@/lib/format';
import { showNotice } from '@/lib/notice-store';
import type { TransitJourneySearch } from '@/lib/types';

/** Pins can hold a change of bus, so the search has to allow one. */
const FOLLOW_MAX_TRANSFERS = 1;

export function useFollowPinnedRoute() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const dataset = useTransitDataset();
  const { data: bootstrap } = useBootstrap();
  const holidays = bootstrap?.holidays;
  const { canStartMore, startFromJourney, isTrackingJourney } = useBusTracking();
  const [followingId, setFollowingId] = useState<string | null>(null);

  const followPin = useCallback(
    async (pin: PinnedRoute) => {
      if (followingId) return;
      // Checked before the search as well as after: a rider at the cap should not wait on
      // three requests to be told no.
      if (!canStartMore) {
        showNotice({ title: t('transitTrackCapTitle'), message: t('transitTrackCapMessage') });
        return;
      }

      setFollowingId(pin.id);
      try {
        const horizon = nextServiceDays(new Date(), holidays);

        // One search per day TYPE, not per date: `weekday` answers every weekday in the window.
        const byDayType = new Map<DayType, Promise<TransitJourneySearch>>();
        const searchFor = (dayType: DayType) => {
          const existing = byDayType.get(dayType);
          if (existing) return existing;
          const key: JourneySearchKey = {
            origin: pin.origin,
            destination: pin.destination,
            day: dayType,
            start: FULL_DAY_START,
            maxTransfers: FOLLOW_MAX_TRANSFERS,
            dataset,
          };
          const promise = queryClient.fetchQuery({
            queryKey: journeySearchQueryKey(key),
            queryFn: () => fetchJourneySearchResult({ ...key, source: 'follow_pin' }),
          });
          byDayType.set(dayType, promise);
          return promise;
        };

        const days: FollowDay[] = await Promise.all(
          horizon.map(async (day) => ({
            date: day.date,
            dayType: day.dayType,
            journeys: (await searchFor(day.dayType)).journeys,
          })),
        );

        const outcome = resolvePinnedFollow(pin, days, new Date());

        if (outcome.status === 'none') {
          showNotice({
            title: t('transitPinnedNoServiceTitle'),
            message: t('transitPinnedNoServiceMessage', {
              route: pin.routeNumber,
              time: pin.legs?.[0]?.start ?? '',
            }),
          });
          return;
        }

        if (outcome.status === 'later') {
          const isTomorrow = horizon[1]?.date === outcome.date;
          showNotice({
            title: t('transitPinnedNextDepartureTitle'),
            message: isTomorrow
              ? t('transitPinnedNextTomorrow', { time: outcome.time })
              : t('transitPinnedNextOnDay', {
                  day: formatWeekdayDate(outcome.date, i18n.language),
                  time: outcome.time,
                }),
          });
          return;
        }

        if (isTrackingJourney(outcome.journey.id)) {
          showNotice({ title: t('transitActiveTracking'), message: t('alreadyTrackingJourney') });
          return;
        }
        if (!startFromJourney(outcome.journey, outcome.dayType)) {
          showNotice({ title: t('transitTrackCapTitle'), message: t('transitTrackCapMessage') });
        }
      } catch {
        showNotice({
          title: t('transitPinnedFollowFailedTitle'),
          message: t('transitPinnedFollowFailedMessage'),
        });
      } finally {
        setFollowingId(null);
      }
    },
    [
      followingId,
      canStartMore,
      holidays,
      dataset,
      queryClient,
      isTrackingJourney,
      startFromJourney,
      t,
      i18n.language,
    ],
  );

  return { followPin, followingId };
}
