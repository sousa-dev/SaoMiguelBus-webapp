// Ported from SaoMiguelBus/features/azoresbus/hooks/useAzoresbusTrackingQueries.ts.
import { useQuery } from '@tanstack/react-query';

import { staticIslandConfig } from '@/config/island';
import {
  azoresbusTrackingPollIntervalMs,
  azoresbusTrackingStaleTimeMs,
} from '@/features/transit/live/lib/trackingPollInterval';
import { fetchAzoresbusStopArrivals, fetchAzoresbusVehicle, fetchAzoresbusVehicles } from '@/lib/api';

export type TrackingQueryOptions = {
  enabled?: boolean;
  /** Poll only while the map is on screen (tab visible + online). */
  screenActive?: boolean;
};

function trackingQueryOptions(screenActive: boolean) {
  return {
    staleTime: azoresbusTrackingStaleTimeMs(),
    refetchOnMount: true as const,
    refetchOnWindowFocus: false as const,
    refetchInterval: screenActive ? azoresbusTrackingPollIntervalMs() : (false as const),
    refetchIntervalInBackground: false as const,
  };
}

export function useAzoresbusVehicles(options: TrackingQueryOptions = {}) {
  const { enabled = true, screenActive = false } = options;
  return useQuery({
    queryKey: ['azoresbus', 'v1', 'vehicles', staticIslandConfig.islandKey],
    queryFn: fetchAzoresbusVehicles,
    enabled,
    ...trackingQueryOptions(screenActive),
  });
}

/** One vehicle's detail (its circulations weigh ~10KB), fetched only while its panel is open. */
export function useAzoresbusVehicleDetail(vehicleId: string | null, options: TrackingQueryOptions = {}) {
  const { enabled = true, screenActive = false } = options;
  const id = vehicleId?.trim() ?? '';
  return useQuery({
    queryKey: ['azoresbus', 'v1', 'vehicle', staticIslandConfig.islandKey, id],
    queryFn: () => fetchAzoresbusVehicle(id),
    enabled: enabled && id.length > 0,
    ...trackingQueryOptions(screenActive),
  });
}

/** Live buses inbound to one stop, on the fleet cadence. */
export function useAzoresbusStopArrivals(stopId: number | null, options: TrackingQueryOptions = {}) {
  const { enabled = true, screenActive = false } = options;
  return useQuery({
    queryKey: ['azoresbus', 'v1', 'stop-arrivals', staticIslandConfig.islandKey, stopId],
    queryFn: () => fetchAzoresbusStopArrivals(stopId as number),
    enabled: enabled && stopId != null,
    ...trackingQueryOptions(screenActive),
  });
}
