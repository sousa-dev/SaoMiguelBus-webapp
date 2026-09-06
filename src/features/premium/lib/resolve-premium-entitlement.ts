// Ported from SaoMiguelBus/features/premium/lib/resolve-premium-entitlement.ts for purchases-js.
import type { CustomerInfo } from '@revenuecat/purchases-js';

import type { Entitlement, ManageVia } from '@/lib/types';

function toIso(value: Date | string | null | undefined): string | null {
  if (value == null) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function buildSubscriptionEntitlement(
  expirationIso: string | null,
  willRenew: boolean,
  manageVia: ManageVia,
): Entitlement {
  return {
    tier: 'premium',
    source: 'revenuecat',
    status: willRenew ? 'active' : 'cancelled',
    currentPeriodEnd: expirationIso,
    features: [],
    manageVia,
  };
}

/**
 * Resolve premium from RevenueCat `CustomerInfo`. Tourist day-passes are not sold on the web,
 * so the mobile app's stacked non-subscription branch is intentionally absent here.
 */
export function resolvePremiumEntitlementFromCustomerInfo(
  info: CustomerInfo,
  entitlementId: string,
  subscriptionManageVia: ManageVia = 'web',
  now = Date.now(),
): Entitlement | null {
  const active = info.entitlements.active[entitlementId];
  const expirationIso = toIso(active?.expirationDate);

  if (expirationIso) {
    if (new Date(expirationIso).getTime() > now) {
      return buildSubscriptionEntitlement(expirationIso, active!.willRenew, subscriptionManageVia);
    }
  } else if (active?.willRenew) {
    return buildSubscriptionEntitlement(null, true, subscriptionManageVia);
  }

  // A grant issued from the RevenueCat dashboard (team, support make-good, lifetime award):
  // active, never expires, never renews — the same shape a spent one-off leaves behind. Only
  // RevenueCat itself issues `promotional`, so the store tells them apart.
  if (active?.isActive && active.store === 'promotional') {
    return buildSubscriptionEntitlement(expirationIso, active.willRenew, 'none');
  }

  if (active?.isActive && expirationIso == null && !active.willRenew) {
    return null;
  }

  if (active?.isActive && expirationIso == null) {
    return buildSubscriptionEntitlement(null, active.willRenew, subscriptionManageVia);
  }

  return null;
}
