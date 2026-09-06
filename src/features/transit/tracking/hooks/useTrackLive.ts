import { useQuery } from '@tanstack/react-query';

import { staticIslandConfig } from '@/config/island';
import { fetchTransitTripsLive } from '@/lib/api';
import { useDocumentVisible } from '@/lib/hooks/useDocumentVisible';
import { useNetworkOnline } from '@/lib/hooks/useNetworkOnline';
import type { TransitTripLive } from '@/lib/types';

/** Fleet cadence: positions refresh about once a minute, so polling faster buys nothing. */
export const TRACK_LIVE_POLL_MS = 60_000;

/**
 * The live bus for each trip id, polled while the tab is visible and online. An empty id list
 * disables the query entirely, so a widget with nothing tracked costs nothing.
 */
export function useTrackLive(tripIds: number[]): { trips: TransitTripLive[]; dataUpdatedAt: number } {
  const visible = useDocumentVisible();
  const online = useNetworkOnline();
  const key = tripIds.join(',');
  const query = useQuery({
    queryKey: ['azoresbus', 'v1', 'trips-live', staticIslandConfig.islandKey, key],
    queryFn: () => fetchTransitTripsLive(tripIds),
    enabled: tripIds.length > 0,
    staleTime: TRACK_LIVE_POLL_MS,
    refetchInterval: visible && online && tripIds.length > 0 ? TRACK_LIVE_POLL_MS : false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
  });
  return { trips: query.data?.trips ?? [], dataUpdatedAt: query.dataUpdatedAt };
}
