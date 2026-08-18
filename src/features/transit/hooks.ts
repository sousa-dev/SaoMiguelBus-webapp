import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import {
  fetchDirections,
  fetchLineDetail,
  fetchLineShape,
  fetchRouteWeather,
  fetchStopDetail,
  fetchStops,
  fetchTariffs,
  fetchTripDetail,
  fetchTripGeometry,
  searchTransitJourneys,
  voteTrip,
} from '@/lib/api';
import { track } from '@/lib/analytics';
import { FULL_DAY_START } from '@/lib/format';
import { useTransitDataset } from '@/features/transit/schedule-hooks';
import type {
  RouteWeather,
  Stop,
  TariffsResponse,
  TransitDataset,
  TransitJourneySearch,
  TransitLegGeometry,
  TransitLineDetail,
  TransitLineShape,
  TransitStopDetail,
  TripDetail,
} from '@/lib/types';

/**
 * The dataset segment every transit query key carries.
 *
 * `'server'` rather than `null` keeps the tuple a stable length, and the segment
 * is present even when NOT previewing on purpose: without it a tab left open
 * across the cutover instant would keep serving the previous network out of a
 * 24-hour cache.
 */
function datasetKey(dataset: TransitDataset | null): string {
  return dataset ?? 'server';
}

export function useStops() {
  const dataset = useTransitDataset();
  return useQuery<Stop[]>({
    queryKey: ['transit', 'stops', datasetKey(dataset)],
    queryFn: () => fetchStops(dataset),
  });
}

export interface JourneySearchParams {
  origin: string;
  destination: string;
  day: string;
  /** The rider's own picked time, NOT bucketed — see `departuresStartTime`. */
  start: string;
  /** False ⇒ `maxTransfers: 0`, one bus only. */
  allowTransfers: boolean;
  enabled: boolean;
}

export function useJourneySearch(params: JourneySearchParams) {
  const dataset = useTransitDataset();
  const maxTransfers = params.allowTransfers ? 1 : 0;

  return useQuery<TransitJourneySearch>({
    queryKey: [
      'transit',
      'journeys',
      {
        origin: params.origin,
        destination: params.destination,
        day: params.day,
        start: params.start,
      },
      datasetKey(dataset),
      maxTransfers,
    ],
    queryFn: async () => {
      const result = await searchTransitJourneys({
        origin: params.origin,
        destination: params.destination,
        day: params.day,
        start: params.start,
        maxTransfers,
        dataset,
      });

      // A late search returning nothing is not "no connection between these
      // stops" — re-ask for the whole day so the empty state can say which it
      // is. One extra request, only on an empty result, only when a time was set.
      let earlierJourneysAvailable: number | undefined;
      if (result.journeys.length === 0 && params.start !== FULL_DAY_START) {
        try {
          const wholeDay = await searchTransitJourneys({
            origin: params.origin,
            destination: params.destination,
            day: params.day,
            start: FULL_DAY_START,
            maxTransfers,
            dataset,
          });
          if (wholeDay.journeys.length > 0) {
            earlierJourneysAvailable = wholeDay.journeys.length;
          }
        } catch {
          // The primary answer stands; this only enriches the empty state.
        }
      }

      track('transit', 'search', {
        origin: params.origin,
        destination: params.destination,
        day_type: params.day,
        start_time: params.start,
        results_count: result.journeys.length,
        max_transfers: maxTransfers,
        dataset: datasetKey(dataset),
      });

      return earlierJourneysAvailable != null
        ? { ...result, earlierJourneysAvailable }
        : result;
    },
    enabled: params.enabled && Boolean(params.origin && params.destination),
  });
}

export interface RouteWeatherParams {
  origin: string;
  destination: string;
  dateStr: string;
  time: string;
  earliestArrival?: string;
  enabled: boolean;
}

function parseStartHour(time: string): number {
  const [hours] = time.split(':');
  return Number(hours) || 0;
}

function tripTimeToIso(dateStr: string, tripTime: string): string {
  const match = tripTime.match(/(\d{1,2})[h:](\d{2})/);
  if (!match) return `${dateStr}T00:00`;
  return `${dateStr}T${match[1].padStart(2, '0')}:${match[2]}`;
}

export function useRouteWeather(params: RouteWeatherParams) {
  const startHour = parseStartHour(params.time);
  const forecastMode = startHour >= 5 && Boolean(params.earliestArrival);
  const originAt = forecastMode ? `${params.dateStr}T${params.time}` : undefined;
  const destinationAt =
    forecastMode && params.earliestArrival
      ? tripTimeToIso(params.dateStr, params.earliestArrival)
      : undefined;

  return useQuery<RouteWeather>({
    queryKey: [
      'transit',
      'route-weather',
      params.origin,
      params.destination,
      originAt,
      destinationAt,
    ],
    queryFn: async () => {
      const data = await fetchRouteWeather({
        origin: params.origin,
        destination: params.destination,
        originAt,
        destinationAt,
      });
      track('weather', 'view', {
        screen: 'transit_inline',
        mode: forecastMode ? 'forecast' : 'current',
      });
      return data;
    },
    enabled: params.enabled && Boolean(params.origin && params.destination),
  });
}

export function useTripDetail(tripId: number | null) {
  const dataset = useTransitDataset();
  return useQuery<TripDetail>({
    queryKey: ['transit', 'trip', tripId, datasetKey(dataset)],
    queryFn: () => fetchTripDetail(tripId as number, dataset),
    enabled: tripId != null,
    // While previewing, the server may resolve its own dataset from its own date
    // and 404 a trip that only exists on the other network. One retry is enough
    // to rule out a blip; more just delays the fallback.
    retry: false,
  });
}

/**
 * The drawable path for one ride leg, or for a whole trip when both sequences
 * are omitted.
 */
export function useTripGeometry(params: {
  tripId: number | null;
  from?: number;
  to?: number;
  enabled?: boolean;
}) {
  const dataset = useTransitDataset();
  return useQuery<TransitLegGeometry>({
    queryKey: [
      'transit',
      'trip-geometry',
      params.tripId,
      params.from ?? null,
      params.to ?? null,
      datasetKey(dataset),
    ],
    queryFn: () =>
      fetchTripGeometry({
        tripId: params.tripId as number,
        from: params.from,
        to: params.to,
        dataset,
      }),
    enabled: (params.enabled ?? true) && params.tripId != null,
  });
}

export function useStopDetail(params: {
  stopId: number | null;
  day: string;
  start: string;
  enabled?: boolean;
}) {
  const dataset = useTransitDataset();
  return useQuery<TransitStopDetail>({
    queryKey: [
      'transit',
      'stop',
      params.stopId,
      params.day,
      params.start,
      datasetKey(dataset),
    ],
    queryFn: () =>
      fetchStopDetail({
        stopId: params.stopId as number,
        day: params.day,
        start: params.start,
        dataset,
      }),
    enabled: (params.enabled ?? true) && params.stopId != null,
    // The departures window advances with the clock; keep the last one on screen
    // rather than flashing a spinner over an unchanged timetable.
    placeholderData: (previous) => previous,
  });
}

export function useLineShape(code: string | null) {
  const dataset = useTransitDataset();
  return useQuery<TransitLineShape>({
    queryKey: ['transit', 'line-shape', code, datasetKey(dataset)],
    queryFn: () => fetchLineShape(code as string, dataset),
    enabled: Boolean(code),
  });
}

export function useLineDetail(code: string | null) {
  const dataset = useTransitDataset();
  return useQuery<TransitLineDetail>({
    queryKey: ['transit', 'line', code, datasetKey(dataset)],
    queryFn: () => fetchLineDetail(code as string, dataset),
    enabled: Boolean(code),
  });
}

/** `null` data means "no snapshot synced yet" — an empty state, not an error. */
export function useTariffs() {
  return useQuery<TariffsResponse | null>({
    queryKey: ['transit', 'tariffs'],
    queryFn: fetchTariffs,
  });
}

export function useDirections(params: {
  origin: string;
  destination: string;
  day: string;
  start: string;
  enabled: boolean;
}) {
  const { i18n } = useTranslation();
  const locale = i18n.language?.split('-')[0] ?? 'pt';
  return useQuery({
    queryKey: ['transit', 'directions', params.origin, params.destination, params.day, params.start, locale],
    queryFn: async () => {
      const data = await fetchDirections({
        origin: params.origin,
        destination: params.destination,
        day: params.day,
        start: params.start,
        locale,
      });
      track('transit', 'engage', {
        action: 'get_directions',
        origin: params.origin,
        destination: params.destination,
        day_type: params.day,
        routes_count: data.routes?.length ?? 0,
      });
      return data;
    },
    enabled: params.enabled && Boolean(params.origin && params.destination),
  });
}

export function useTripVote(tripId: number) {
  const qc = useQueryClient();
  const dataset = useTransitDataset();
  return useMutation({
    mutationFn: async (intent: 'like' | 'dislike') => {
      const detail = await voteTrip(tripId, intent, dataset);
      track('transit', 'vote', { trip_id: tripId, direction: intent, verb: intent });
      return detail;
    },
    onSuccess: (data) => {
      qc.setQueryData(['transit', 'trip', tripId, datasetKey(dataset)], data);
    },
  });
}
