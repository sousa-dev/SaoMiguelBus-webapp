// Ported from SaoMiguelBus/lib/entitlement-store.ts; only the storage backend and the
// non-persisted `syncStatus` slice differ.
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { webStorage } from '@/lib/persist-storage';
import type { Entitlement } from '@/lib/types';

const ENTITLEMENT_KEY = 'azores_hub_entitlement';

/** How long an optimistic (post-purchase) premium unlock is trusted over a lagging backend. */
export const OPTIMISTIC_GRACE_MS = 1000 * 60 * 5;

/**
 * `pending` = signed in, nothing cached, first `/billing/entitlement` still in flight. The only
 * state in which ad surfaces hold back (bounded by `useEntitlementSync`'s settle timeout).
 */
export type EntitlementSyncStatus = 'idle' | 'pending' | 'settled';

interface EntitlementState {
  /** Authoritative entitlement from GET /api/v3/billing/entitlement (signed-in only). */
  backendEntitlement: Entitlement | null;
  /** Entitlement derived from RevenueCat CustomerInfo. */
  storeEntitlement: Entitlement | null;
  /**
   * Epoch ms until which an optimistic premium unlock wins over a backend `free`
   * (webhook latency window). Cleared once the backend confirms or the window lapses.
   */
  optimisticUntil: number | null;
  syncStatus: EntitlementSyncStatus;
  setSyncStatus: (status: EntitlementSyncStatus) => void;
  clearBackendEntitlement: () => void;
  clearEntitlement: () => void;
  applyOptimisticPremium: (entitlement: Entitlement) => void;
  reconcileFromBackend: (entitlement: Entitlement) => void;
  reconcileFromStore: (entitlement: Entitlement | null) => void;
}

function isPremiumEntitlement(entitlement: Entitlement | null | undefined): boolean {
  return entitlement?.tier === 'premium';
}

/** Whether a premium entitlement is still active at `now` (wall-clock expiry for passes). */
export function isEntitlementPremiumActive(
  entitlement: Entitlement | null | undefined,
  now = Date.now(),
): boolean {
  if (!isPremiumEntitlement(entitlement)) {
    return false;
  }
  if (entitlement!.currentPeriodEnd == null) {
    return true;
  }
  return new Date(entitlement!.currentPeriodEnd).getTime() > now;
}

type EntitlementSlices = Pick<EntitlementState, 'backendEntitlement' | 'storeEntitlement'>;

/** Merged entitlement for display — backend preferred when both are premium. */
export function selectEntitlement(state: EntitlementSlices, now = Date.now()): Entitlement | null {
  const { backendEntitlement, storeEntitlement } = state;
  if (isEntitlementPremiumActive(backendEntitlement, now)) {
    return backendEntitlement;
  }
  if (isEntitlementPremiumActive(storeEntitlement, now)) {
    return storeEntitlement;
  }
  return backendEntitlement ?? storeEntitlement;
}

export function selectIsPremium(state: EntitlementSlices, now = Date.now()): boolean {
  return (
    isEntitlementPremiumActive(state.backendEntitlement, now) ||
    isEntitlementPremiumActive(state.storeEntitlement, now)
  );
}

export function shouldApplyBackendEntitlement(
  entitlement: Entitlement,
  optimisticUntil: number | null,
  now = Date.now(),
): boolean {
  const withinGrace = optimisticUntil != null && now < optimisticUntil;
  if (withinGrace && entitlement.tier === 'free') {
    return false;
  }
  return true;
}

export const useEntitlementStore = create<EntitlementState>()(
  persist(
    (set, get) => ({
      backendEntitlement: null,
      storeEntitlement: null,
      optimisticUntil: null,
      syncStatus: 'idle',
      setSyncStatus: (syncStatus) => {
        if (get().syncStatus !== syncStatus) set({ syncStatus });
      },
      clearBackendEntitlement: () => set({ backendEntitlement: null }),
      clearEntitlement: () =>
        set({ backendEntitlement: null, storeEntitlement: null, optimisticUntil: null }),
      applyOptimisticPremium: (entitlement) =>
        set({ storeEntitlement: entitlement, optimisticUntil: Date.now() + OPTIMISTIC_GRACE_MS }),
      reconcileFromBackend: (entitlement) => {
        if (!shouldApplyBackendEntitlement(entitlement, get().optimisticUntil)) {
          return;
        }
        set({ backendEntitlement: entitlement, optimisticUntil: null });
      },
      reconcileFromStore: (entitlement) => set({ storeEntitlement: entitlement }),
    }),
    {
      name: ENTITLEMENT_KEY,
      storage: createJSONStorage(webStorage),
      partialize: (state) => ({
        backendEntitlement: state.backendEntitlement,
        storeEntitlement: state.storeEntitlement,
        optimisticUntil: state.optimisticUntil,
      }),
      version: 1,
    },
  ),
);

/** Non-hook snapshot accessor (for use outside React). */
export function getEntitlement(): Entitlement | null {
  return selectEntitlement(useEntitlementStore.getState());
}

export function getIsPremium(): boolean {
  return selectIsPremium(useEntitlementStore.getState());
}
