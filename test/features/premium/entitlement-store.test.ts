// Ported from SaoMiguelBus/__tests__/lib/entitlement-store.test.ts (node:test → vitest).
import { beforeEach, describe, expect, it } from 'vitest';

import {
  OPTIMISTIC_GRACE_MS,
  isEntitlementPremiumActive,
  selectEntitlement,
  selectIsPremium,
  shouldApplyBackendEntitlement,
  useEntitlementStore,
} from '@/features/premium/entitlement-store';
import type { Entitlement } from '@/lib/types';

const premiumStore: Entitlement = {
  tier: 'premium',
  source: 'revenuecat',
  status: 'active',
  currentPeriodEnd: null,
  features: [],
  manageVia: 'web',
};

const premiumBackend: Entitlement = {
  tier: 'premium',
  source: 'legacy_email',
  status: 'active',
  currentPeriodEnd: null,
  features: [],
  manageVia: 'none',
};

const freeBackend: Entitlement = {
  tier: 'free',
  source: null,
  status: null,
  currentPeriodEnd: null,
  features: [],
  manageVia: 'none',
};

beforeEach(() => {
  useEntitlementStore.getState().clearEntitlement();
});

describe('entitlement selectors', () => {
  it('selectIsPremium is true when the store entitlement is premium', () => {
    expect(selectIsPremium({ backendEntitlement: null, storeEntitlement: premiumStore })).toBe(true);
  });

  it('selectIsPremium is true when the backend lags but the store is premium', () => {
    expect(selectIsPremium({ backendEntitlement: freeBackend, storeEntitlement: premiumStore })).toBe(
      true,
    );
  });

  it('selectIsPremium honours currentPeriodEnd', () => {
    const now = new Date('2026-01-01T00:00:00.000Z').getTime();
    const expired = { ...premiumStore, currentPeriodEnd: '2020-01-01T00:00:00.000Z' };
    const active = { ...premiumStore, currentPeriodEnd: '2026-06-01T00:00:00.000Z' };
    expect(selectIsPremium({ backendEntitlement: null, storeEntitlement: expired }, now)).toBe(false);
    expect(selectIsPremium({ backendEntitlement: null, storeEntitlement: active }, now)).toBe(true);
  });

  it('isEntitlementPremiumActive treats null currentPeriodEnd as lifetime premium', () => {
    expect(isEntitlementPremiumActive(premiumStore)).toBe(true);
    expect(isEntitlementPremiumActive(freeBackend)).toBe(false);
    expect(isEntitlementPremiumActive(null)).toBe(false);
  });

  it('selectEntitlement prefers the backend when both are premium', () => {
    expect(
      selectEntitlement({ backendEntitlement: premiumBackend, storeEntitlement: premiumStore }),
    ).toBe(premiumBackend);
  });

  it('selectEntitlement falls back to the store when the backend is free', () => {
    expect(selectEntitlement({ backendEntitlement: freeBackend, storeEntitlement: premiumStore })).toBe(
      premiumStore,
    );
  });

  it('shouldApplyBackendEntitlement ignores a free backend inside the optimistic window', () => {
    const now = 1_000_000;
    expect(shouldApplyBackendEntitlement(freeBackend, now + OPTIMISTIC_GRACE_MS, now)).toBe(false);
    expect(shouldApplyBackendEntitlement(premiumBackend, now + OPTIMISTIC_GRACE_MS, now)).toBe(true);
    expect(shouldApplyBackendEntitlement(freeBackend, now - 1, now)).toBe(true);
    expect(shouldApplyBackendEntitlement(freeBackend, null, now)).toBe(true);
  });
});

describe('entitlement store actions', () => {
  it('applyOptimisticPremium opens a grace window that a free backend cannot close', () => {
    const store = useEntitlementStore.getState();
    store.applyOptimisticPremium(premiumStore);
    expect(useEntitlementStore.getState().optimisticUntil).toBeGreaterThan(Date.now());
    store.reconcileFromBackend(freeBackend);
    expect(useEntitlementStore.getState().backendEntitlement).toBeNull();
    expect(selectIsPremium(useEntitlementStore.getState())).toBe(true);
  });

  it('a premium backend closes the grace window', () => {
    const store = useEntitlementStore.getState();
    store.applyOptimisticPremium(premiumStore);
    store.reconcileFromBackend(premiumBackend);
    expect(useEntitlementStore.getState().optimisticUntil).toBeNull();
    expect(useEntitlementStore.getState().backendEntitlement).toBe(premiumBackend);
  });

  it('clearEntitlement wipes both slices', () => {
    const store = useEntitlementStore.getState();
    store.reconcileFromBackend(premiumBackend);
    store.reconcileFromStore(premiumStore);
    store.clearEntitlement();
    expect(useEntitlementStore.getState()).toMatchObject({
      backendEntitlement: null,
      storeEntitlement: null,
      optimisticUntil: null,
    });
  });
});
