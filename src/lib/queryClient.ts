import { QueryClient } from '@tanstack/react-query';

/** Mirrors the Expo app's defaults (lib/query-provider.tsx): 30 min stale, 24 h gc, 1 retry. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 60 * 1000,
      gcTime: 24 * 60 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
