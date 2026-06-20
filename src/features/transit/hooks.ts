import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import {
  fetchDirections,
  fetchStops,
  fetchTripDetail,
  searchTransit,
  voteTrip,
} from '@/lib/api';
import { track } from '@/lib/analytics';
import type { Stop, TransitSearchResult, TripDetail } from '@/lib/types';

export function useStops() {
  return useQuery<Stop[]>({ queryKey: ['transit', 'stops'], queryFn: fetchStops });
}

export interface TransitSearchParams {
  origin: string;
  destination: string;
  day: string;
  start: string;
  enabled: boolean;
}

export function useTransitSearch(params: TransitSearchParams) {
  return useQuery<TransitSearchResult[]>({
    queryKey: ['transit', 'search', params.origin, params.destination, params.day, params.start],
    queryFn: async () => {
      const results = await searchTransit({
        origin: params.origin,
        destination: params.destination,
        day: params.day,
        start: params.start,
      });
      track('transit', 'search', {
        origin: params.origin,
        destination: params.destination,
        day_type: params.day,
        start_time: params.start,
        results_count: results.length,
      });
      return results;
    },
    enabled: params.enabled && Boolean(params.origin && params.destination),
  });
}

export function useTripDetail(tripId: number | null) {
  return useQuery<TripDetail>({
    queryKey: ['transit', 'trip', tripId],
    queryFn: () => fetchTripDetail(tripId as number),
    enabled: tripId != null,
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
  return useMutation({
    mutationFn: async (intent: 'like' | 'dislike') => {
      const detail = await voteTrip(tripId, intent);
      track('transit', 'vote', { trip_id: tripId, direction: intent, verb: intent });
      return detail;
    },
    onSuccess: (data) => {
      qc.setQueryData(['transit', 'trip', tripId], data);
    },
  });
}
