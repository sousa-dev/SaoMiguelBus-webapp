import { useEffect } from 'react';

import { useAuthStore } from '@/features/account/auth-store';
import { useEntitlementStore } from '@/features/premium/entitlement-store';
import { resolvePremiumEntitlementFromCustomerInfo } from '@/features/premium/lib/resolve-premium-entitlement';
import {
  closeRevenueCat,
  ensureRevenueCat,
  getWebCustomerInfo,
  isRevenueCatConfigured,
  revenueCatEntitlementId,
} from '@/features/premium/lib/revenuecat-web';

/**
 * Keeps the RevenueCat identity bound to the signed-in account and mirrors its `CustomerInfo`
 * into the store entitlement (on sign-in and whenever the tab becomes visible again). Signing
 * out closes the SDK. Mount once in the shell.
 */
export function useRevenueCatBootstrap(): void {
  const hydrated = useAuthStore((s) => s.hydrated);
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const reconcileFromStore = useEntitlementStore((s) => s.reconcileFromStore);

  useEffect(() => {
    if (!hydrated || !isRevenueCatConfigured() || typeof document === 'undefined') return;

    if (userId == null) {
      closeRevenueCat();
      reconcileFromStore(null);
      return;
    }

    let cancelled = false;
    const sync = async () => {
      const user = useAuthStore.getState().user;
      if (!user) return;
      try {
        await ensureRevenueCat(user);
        const info = await getWebCustomerInfo();
        if (cancelled || !info) return;
        reconcileFromStore(
          resolvePremiumEntitlementFromCustomerInfo(info, revenueCatEntitlementId(), 'web'),
        );
      } catch {
        // Offline or SDK failure: the backend entitlement still drives premium.
      }
    };

    void sync();
    const onVisible = () => {
      if (document.visibilityState === 'visible') void sync();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [hydrated, reconcileFromStore, userId]);
}
