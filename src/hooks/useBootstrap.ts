import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { fetchBootstrap } from '@/lib/api';
import { applyBrandTheme } from '@/lib/theme';
import type { BootstrapResponse } from '@/lib/types';

export function useBootstrap() {
  const query = useQuery<BootstrapResponse>({
    queryKey: ['bootstrap', 'v3'],
    queryFn: fetchBootstrap,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (query.data?.island?.theme) {
      applyBrandTheme(query.data.island.theme);
    }
  }, [query.data]);

  return query;
}
