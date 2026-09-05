import type { NetworkProviderId } from '@/features/ads/providers/types';

/**
 * Providers whose script failed to load this session (ad blocker, network error). Later slots skip
 * them synchronously so the house creative appears without waiting on a second failure.
 */
const blocked = new Set<NetworkProviderId>();

export function markProviderBlocked(id: NetworkProviderId): void {
  blocked.add(id);
}

export function isProviderBlocked(id: NetworkProviderId): boolean {
  return blocked.has(id);
}

export function resetBlockedProvidersForTests(): void {
  blocked.clear();
}
