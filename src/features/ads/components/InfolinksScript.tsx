import { useEffect } from 'react';

import { getWebAdConfig, isInfolinksConfigured } from '@/features/ads/providers/config';
import { useNetworkConsentMode } from '@/features/ads/providers/consent-mode';
import { loadInfolinks } from '@/features/ads/providers/infolinks';
import { useCanShowAds } from '@/features/premium/usePremium';

/**
 * Mounted once in AppShell, always — same pattern as AnalyticsLifecycle. Infolinks has no per-slot
 * API (see WebAdConfig.infolinks), so unlike AdBanner's waterfall this loads a single global script
 * that scans the page's own text and injects its own in-text/in-tag units; it runs alongside any
 * banner network rather than competing for a slot.
 */
export function InfolinksScript() {
  const canShowAds = useCanShowAds();
  const consentMode = useNetworkConsentMode();
  const config = getWebAdConfig();

  useEffect(() => {
    if (!canShowAds || consentMode === 'blocked' || !isInfolinksConfigured(config)) return;
    void loadInfolinks(config);
  }, [canShowAds, config, consentMode]);

  return null;
}
