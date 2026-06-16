import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { InternalFullscreenModal } from '@/features/ads/components/InternalFullscreenModal';
import { evaluateInternalAppOpenPolicy } from '@/features/ads/lib/app-open-policy';
import {
  hasSessionAppOpenShown,
  loadLastFullScreenAdAt,
  markFullScreenAdShown,
  markSessionAppOpenShown,
} from '@/features/ads/lib/app-open-storage';
import {
  isFirstPartyInterstitialVisible,
  isInternalFullscreenAdVisible,
  setInternalFullscreenAdVisible,
} from '@/features/ads/lib/fullscreen-ad-state';
import { selectInternalCreative } from '@/features/ads/lib/internal-ads/select-creative';
import type { InternalAdCreative } from '@/features/ads/lib/internal-ads/types';
import { useCanShowAds } from '@/features/premium/usePremium';
import { resolveEnabledModules } from '@/config/island';
import { useBootstrap } from '@/hooks/useBootstrap';

type Props = {
  bootstrapReady: boolean;
};

/** Once per browser session on `/` or `/transit` after bootstrap resolves. */
export function SessionAdOrchestrator({ bootstrapReady }: Props) {
  const canShowAds = useCanShowAds();
  const location = useLocation();
  const { data: bootstrap } = useBootstrap();
  const enabledModuleKeys = useMemo(
    () => resolveEnabledModules(bootstrap?.island?.enabledModules),
    [bootstrap?.island?.enabledModules],
  );

  const [internalCreative, setInternalCreative] = useState<InternalAdCreative | null>(null);
  const [showInternal, setShowInternal] = useState(false);
  const attemptedRef = useRef(false);

  const dismissInternal = useCallback(() => {
    setShowInternal(false);
    setInternalCreative(null);
    setInternalFullscreenAdVisible(false);
  }, []);

  useEffect(() => {
    if (!bootstrapReady || attemptedRef.current) return;
    if (!canShowAds) return;

    const path = location.pathname;
    if (path !== '/' && path !== '/transit') return;

    attemptedRef.current = true;

    void (async () => {
      const lastFullScreenAdAt = loadLastFullScreenAdAt();
      const decision = evaluateInternalAppOpenPolicy(
        {
          isPremium: false,
          isInternalFullscreenVisible: isInternalFullscreenAdVisible() || showInternal,
          isInterstitialShowing: false,
          isFirstPartyInterstitialVisible: isFirstPartyInterstitialVisible(),
          lastFullScreenAdAt,
          sessionAppOpenAlreadyShown: hasSessionAppOpenShown(),
        },
        Date.now(),
      );

      if (!decision.show) return;

      const creative = selectInternalCreative({
        slotKey: 'app_open:session',
        enabledModuleKeys,
      });
      if (!creative) return;

      markSessionAppOpenShown();
      setInternalCreative(creative);
      setShowInternal(true);
      setInternalFullscreenAdVisible(true);
      markFullScreenAdShown(Date.now());
    })();
  }, [bootstrapReady, canShowAds, enabledModuleKeys, location.pathname, showInternal]);

  if (!internalCreative) return null;

  return (
    <InternalFullscreenModal
      visible={showInternal}
      creative={internalCreative}
      surface="app_open"
      onDismiss={dismissInternal}
    />
  );
}
