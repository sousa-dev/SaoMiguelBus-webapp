import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import {
  fetchDirections,
  fetchStops,
  fetchTripDetail,
  searchTransit,
  voteTrip,
} from '@/lib/api';
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
    queryFn: () =>
      searchTransit({
        origin: params.origin,
        destination: params.destination,
        day: params.day,
        start: params.start,
      }),
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
    queryFn: () =>
      fetchDirections({
        origin: params.origin,
        destination: params.destination,
        day: params.day,
        start: params.start,
        locale,
      }),
    enabled: params.enabled && Boolean(params.origin && params.destination),
  });
}

export function useTripVote(tripId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vote: Parameters<typeof voteTrip>[1]) => voteTrip(tripId, vote),
    onSuccess: (data) => {
      qc.setQueryData(['transit', 'trip', tripId], data);
    },
  });
}
