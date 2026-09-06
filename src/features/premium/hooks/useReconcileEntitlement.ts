import type { CustomerInfo } from '@revenuecat/purchases-js';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useEntitlementStore } from '@/features/premium/entitlement-store';
import { resolvePremiumEntitlementFromCustomerInfo } from '@/features/premium/lib/resolve-premium-entitlement';
import { revenueCatEntitlementId } from '@/features/premium/lib/revenuecat-web';

/**
 * After a purchase or restore: unlock premium from the SDK's `CustomerInfo` at once (optimistic,
 * held for the grace window) and ask the backend for the authoritative answer.
 */
export function useReconcileEntitlement() {
  const queryClient = useQueryClient();
  const applyOptimisticPremium = useEntitlementStore((s) => s.applyOptimisticPremium);
  const reconcileFromStore = useEntitlementStore((s) => s.reconcileFromStore);

  return useCallback(
    async (info: CustomerInfo | null): Promise<boolean> => {
      const entitlement = info
        ? resolvePremiumEntitlementFromCustomerInfo(info, revenueCatEntitlementId(), 'web')
        : null;
      if (entitlement) {
        applyOptimisticPremium(entitlement);
      } else {
        reconcileFromStore(null);
      }
      await queryClient.invalidateQueries({ queryKey: ['billing', 'entitlement'] });
      return entitlement != null;
    },
    [applyOptimisticPremium, queryClient, reconcileFromStore],
  );
}
