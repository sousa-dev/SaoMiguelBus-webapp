// Ported from SaoMiguelBus/features/live-tracking/hooks/useLiveVehicleCounts.ts.
import { useQuery } from '@tanstack/react-query';

import { liveVehicleCountsQueryKey } from '@/features/live/lib/liveCounts';
import { fetchLiveVehicleCounts } from '@/lib/api';

const STALE_MS = 60_000;

/**
 * The hub cards' only tracking-related call: a cached per-operator vehicle count that never
 * itself reaches the AVL vendor. No polling, no retry.
 */
export function useLiveVehicleCounts(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;
  return useQuery({
    queryKey: liveVehicleCountsQueryKey(),
    queryFn: fetchLiveVehicleCounts,
    enabled,
    staleTime: STALE_MS,
    refetchInterval: false,
    refetchOnMount: true,
    retry: false,
  });
}
