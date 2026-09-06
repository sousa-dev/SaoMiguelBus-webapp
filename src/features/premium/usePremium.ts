import {
  selectEntitlement,
  selectIsPremium,
  useEntitlementStore,
} from '@/features/premium/entitlement-store';
import type { Entitlement } from '@/lib/types';

/**
 * Premium is the merged backend + RevenueCat entitlement (see `entitlement-store`).
 * The hook names are unchanged from the legacy cookie implementation so ad surfaces did not
 * need to move.
 */
export function usePremium(): boolean {
  return useEntitlementStore((s) => selectIsPremium(s));
}

export function useEntitlement(): Entitlement | null {
  return useEntitlementStore((s) => selectEntitlement(s));
}

/** True only while a signed-in user's first entitlement fetch is in flight and nothing is cached. */
export function usePremiumLoading(): boolean {
  return useEntitlementStore((s) => s.syncStatus === 'pending');
}

/** Ads never render for premium users, and are withheld during the short unknown window. */
export function useCanShowAds(): boolean {
  const isPremium = usePremium();
  const loading = usePremiumLoading();
  return !isPremium && !loading;
}

/** Test-only: force the merged entitlement (null = free, settled). */
export function setPremiumForTests(entitlement: Entitlement | null): void {
  useEntitlementStore.setState({
    backendEntitlement: entitlement,
    storeEntitlement: null,
    optimisticUntil: null,
    syncStatus: 'settled',
  });
}
