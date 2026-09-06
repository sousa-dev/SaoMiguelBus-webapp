import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useAuthStore } from '@/features/account/auth-store';
import { useEntitlementStore } from '@/features/premium/entitlement-store';
import { fetchEntitlement } from '@/lib/api';

/** Upper bound on how long ad surfaces wait for the first entitlement answer. */
export const ENTITLEMENT_SETTLE_TIMEOUT_MS = 5_000;

/**
 * Keeps the backend entitlement in sync while signed in. Mount once in the shell.
 * Mirrors the Expo `useEntitlementSync`, plus the `syncStatus` bookkeeping that lets
 * `useCanShowAds()` hold ads back only for the short first-fetch window.
 */
export function useEntitlementSync(): void {
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s.hydrated);
  const backendEntitlement = useEntitlementStore((s) => s.backendEntitlement);
  const reconcileFromBackend = useEntitlementStore((s) => s.reconcileFromBackend);
  const clearBackendEntitlement = useEntitlementStore((s) => s.clearBackendEntitlement);
  const setSyncStatus = useEntitlementStore((s) => s.setSyncStatus);

  const query = useQuery({
    queryKey: ['billing', 'entitlement', token],
    queryFn: fetchEntitlement,
    enabled: Boolean(token),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  useEffect(() => {
    if (query.data) reconcileFromBackend(query.data);
  }, [query.data, reconcileFromBackend]);

  useEffect(() => {
    if (hydrated && !token) clearBackendEntitlement();
  }, [clearBackendEntitlement, hydrated, token]);

  const answered = query.isSuccess || query.isError;
  useEffect(() => {
    if (!token) {
      setSyncStatus('idle');
      return;
    }
    if (backendEntitlement != null || answered) {
      setSyncStatus('settled');
      return;
    }
    setSyncStatus('pending');
    const timer = setTimeout(() => setSyncStatus('settled'), ENTITLEMENT_SETTLE_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [answered, backendEntitlement, setSyncStatus, token]);
}
