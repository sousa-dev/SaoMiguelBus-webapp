// Ported from the Expo app's resolve-premium-entitlement behaviour for purchases-js `CustomerInfo`.
import type { CustomerInfo, EntitlementInfo } from '@revenuecat/purchases-js';
import { describe, expect, it } from 'vitest';

import { resolvePremiumEntitlementFromCustomerInfo } from '@/features/premium/lib/resolve-premium-entitlement';

const ENTITLEMENT = 'Sao Miguel Hub Premium';
const NOW = new Date('2026-09-06T12:00:00.000Z').getTime();

function info(active: Partial<EntitlementInfo> | null, managementURL: string | null = null): CustomerInfo {
  return {
    entitlements: { active: active ? { [ENTITLEMENT]: active } : {}, all: {} },
    managementURL,
    nonSubscriptionTransactions: [],
  } as unknown as CustomerInfo;
}

describe('resolvePremiumEntitlementFromCustomerInfo', () => {
  it('is null without an active entitlement', () => {
    expect(resolvePremiumEntitlementFromCustomerInfo(info(null), ENTITLEMENT, 'web', NOW)).toBeNull();
  });

  it('maps a renewing subscription with a future expiry to active premium managed on the web', () => {
    const result = resolvePremiumEntitlementFromCustomerInfo(
      info({
        isActive: true,
        willRenew: true,
        expirationDate: new Date('2026-10-06T12:00:00.000Z'),
        store: 'rc_billing',
      }),
      ENTITLEMENT,
      'web',
      NOW,
    );
    expect(result).toEqual({
      tier: 'premium',
      source: 'revenuecat',
      status: 'active',
      currentPeriodEnd: '2026-10-06T12:00:00.000Z',
      features: [],
      manageVia: 'web',
    });
  });

  it('marks a non-renewing subscription cancelled but still premium until it expires', () => {
    const result = resolvePremiumEntitlementFromCustomerInfo(
      info({
        isActive: true,
        willRenew: false,
        expirationDate: new Date('2026-10-06T12:00:00.000Z'),
        store: 'rc_billing',
      }),
      ENTITLEMENT,
      'web',
      NOW,
    );
    expect(result?.status).toBe('cancelled');
    expect(result?.tier).toBe('premium');
  });

  it('ignores an expired subscription', () => {
    expect(
      resolvePremiumEntitlementFromCustomerInfo(
        info({ isActive: false, willRenew: false, expirationDate: new Date('2020-01-01'), store: 'rc_billing' }),
        ENTITLEMENT,
        'web',
        NOW,
      ),
    ).toBeNull();
  });

  it('treats a promotional grant as premium that is not self-managed', () => {
    const result = resolvePremiumEntitlementFromCustomerInfo(
      info({ isActive: true, willRenew: false, expirationDate: null, store: 'promotional' }),
      ENTITLEMENT,
      'web',
      NOW,
    );
    expect(result?.tier).toBe('premium');
    expect(result?.manageVia).toBe('none');
    expect(result?.currentPeriodEnd).toBeNull();
  });

  it('reads a spent one-off (active, no expiry, not renewing, store purchase) as not premium', () => {
    expect(
      resolvePremiumEntitlementFromCustomerInfo(
        info({ isActive: true, willRenew: false, expirationDate: null, store: 'rc_billing' }),
        ENTITLEMENT,
        'web',
        NOW,
      ),
    ).toBeNull();
  });

  it('keeps a lifetime-style entitlement with no expiry that renews', () => {
    const result = resolvePremiumEntitlementFromCustomerInfo(
      info({ isActive: true, willRenew: true, expirationDate: null, store: 'rc_billing' }),
      ENTITLEMENT,
      'web',
      NOW,
    );
    expect(result?.tier).toBe('premium');
    expect(result?.currentPeriodEnd).toBeNull();
  });
});
