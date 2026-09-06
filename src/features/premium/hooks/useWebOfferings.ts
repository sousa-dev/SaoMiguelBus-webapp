import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/features/account/auth-store';
import {
  ensureRevenueCat,
  ensureRevenueCatAnonymous,
  getWebOfferings,
  isRevenueCatConfigured,
} from '@/features/premium/lib/revenuecat-web';

/** Current offering with packages. Anonymous visitors see prices too (anonymous RevenueCat id). */
export function useWebOfferings() {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  return useQuery({
    queryKey: ['revenuecat', 'offerings', userId ?? 'anonymous'],
    queryFn: async () => {
      const user = useAuthStore.getState().user;
      if (user) await ensureRevenueCat(user);
      else await ensureRevenueCatAnonymous();
      return getWebOfferings();
    },
    enabled: isRevenueCatConfigured(),
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });
}
