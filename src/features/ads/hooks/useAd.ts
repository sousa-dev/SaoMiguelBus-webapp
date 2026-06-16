import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo } from 'react';

import { resolveAdSlotKind } from '@/features/ads/lib/ad-slot';
import { resolveAdHref } from '@/features/ads/lib/ad-link';
import { selectInternalCreative } from '@/features/ads/lib/internal-ads/select-creative';
import { useCanShowAds } from '@/features/premium/usePremium';
import { resolveEnabledModules } from '@/config/island';
import { fetchAd, recordAdClick } from '@/lib/api';
import { getAdPlatform } from '@/lib/platform';
import type { AdPayload } from '@/lib/types';
import { useBootstrap } from '@/hooks/useBootstrap';

/**
 * Fetch a single ad slot: API first-party → internal fallback (no AdMob on web).
 */
export function useAd(on: string, slot: string | number = 'top') {
  const canShowAds = useCanShowAds();
  const queryClient = useQueryClient();
  const platform = getAdPlatform();
  const { data: bootstrap } = useBootstrap();

  const enabledModuleKeys = useMemo(
    () => resolveEnabledModules(bootstrap?.island?.enabledModules),
    [bootstrap?.island?.enabledModules],
  );

  useEffect(() => {
    if (!canShowAds) {
      queryClient.removeQueries({ queryKey: ['ad', on, platform, slot] });
    }
  }, [canShowAds, on, platform, queryClient, slot]);

  const query = useQuery<AdPayload | null>({
    queryKey: ['ad', on, platform, slot],
    queryFn: () => fetchAd({ on, platform }),
    enabled: canShowAds,
    staleTime: 1000 * 60,
    retry: false,
  });

  const ad = canShowAds ? (query.data ?? null) : null;
  const slotKey = `${on}:${slot}`;
  const kind = resolveAdSlotKind({
    enabled: canShowAds,
    firstParty: ad,
    fetched: query.isFetched,
  });

  const internalCreative =
    kind === 'internal' ? selectInternalCreative({ slotKey, enabledModuleKeys }) : null;

  const openAd = useCallback(async () => {
    if (!ad) return;
    void recordAdClick(ad.id);
    const href = resolveAdHref(ad);
    if (!href) return;
    window.open(href, '_blank', 'noopener,noreferrer');
  }, [ad]);

  return { kind, ad, internalCreative, openAd, enabled: canShowAds, on, slot };
}
