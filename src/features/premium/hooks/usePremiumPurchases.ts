import type { Package } from '@revenuecat/purchases-js';
import { useMutation } from '@tanstack/react-query';

import { useAuthStore } from '@/features/account/auth-store';
import { useReconcileEntitlement } from '@/features/premium/hooks/useReconcileEntitlement';
import { packageTrialDays } from '@/features/premium/lib/package-display';
import { isPurchaseCancelled, purchaseErrorMessageKey } from '@/features/premium/lib/purchase-errors';
import {
  ensureRevenueCat,
  getWebCustomerInfo,
  purchaseWebPackage,
} from '@/features/premium/lib/revenuecat-web';
import { track } from '@/lib/analytics';

type Options = {
  source: string;
  onPurchased?: () => void;
  /** Receives the locale key for the failure (never called for a user cancel). */
  onPurchaseFailed?: (messageKey: string) => void;
  onRestored?: (premium: boolean) => void;
  onRestoreFailed?: (messageKey: string) => void;
};

export class SignInRequiredError extends Error {
  constructor() {
    super('sign_in_required');
    this.name = 'SignInRequiredError';
  }
}

/** Purchase + restore mutations bound to the signed-in account. */
export function usePremiumPurchases(options: Options) {
  const { source, onPurchased, onPurchaseFailed, onRestored, onRestoreFailed } = options;
  const reconcile = useReconcileEntitlement();

  const purchase = useMutation({
    mutationFn: async (pkg: Package) => {
      const user = useAuthStore.getState().user;
      if (!user) throw new SignInRequiredError();
      await ensureRevenueCat(user);
      const trial = packageTrialDays(pkg) != null;
      track('billing', 'purchase_start', { package_id: pkg.identifier, source, trial });
      return purchaseWebPackage(pkg, user.email);
    },
    onSuccess: async (info, pkg) => {
      await reconcile(info);
      const trial = packageTrialDays(pkg) != null;
      track('billing', 'purchase_success', { package_id: pkg.identifier, source, trial });
      onPurchased?.();
    },
    onError: (error, pkg) => {
      const trial = packageTrialDays(pkg) != null;
      if (isPurchaseCancelled(error)) {
        track('billing', 'purchase_cancel', { package_id: pkg.identifier, source, trial });
        return;
      }
      const key = purchaseErrorMessageKey(error);
      track('billing', 'purchase_error', { package_id: pkg.identifier, source, trial, code: key });
      onPurchaseFailed?.(key);
    },
  });

  const restore = useMutation({
    mutationFn: async () => {
      const user = useAuthStore.getState().user;
      if (!user) throw new SignInRequiredError();
      track('billing', 'restore_click', { source });
      await ensureRevenueCat(user);
      return getWebCustomerInfo();
    },
    onSuccess: async (info) => {
      const premium = await reconcile(info);
      track('billing', 'restore_result', { premium, source });
      onRestored?.(premium);
    },
    onError: (error) => {
      onRestoreFailed?.(purchaseErrorMessageKey(error));
    },
  });

  return { purchase, restore };
}
