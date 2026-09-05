import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { FirstPartyInterstitialModal } from '@/features/ads/components/FirstPartyInterstitialModal';
import { InternalFullscreenModal } from '@/features/ads/components/InternalFullscreenModal';
import { PremiumUpsellModal } from '@/features/ads/components/PremiumUpsellModal';
import { markFullScreenAdShown } from '@/features/ads/lib/app-open-storage';
import {
  setFirstPartyInterstitialVisible,
  setInternalFullscreenAdVisible,
} from '@/features/ads/lib/fullscreen-ad-state';
import { selectInternalCreative } from '@/features/ads/lib/internal-ads/select-creative';
import type { InternalAdCreative } from '@/features/ads/lib/internal-ads/types';
import { evaluateInterstitialPolicy } from '@/features/ads/lib/interstitial-policy';
import {
  loadInterstitialSessionState,
  markInterstitialDismissed,
  persistInterstitialSessionState,
} from '@/features/ads/lib/interstitial-storage';
import { useCanShowAds } from '@/features/premium/usePremium';
import { resolveEnabledModules } from '@/config/island';
import { fetchAd } from '@/lib/api';
import { track } from '@/lib/analytics';
import { getAdPlatform } from '@/lib/platform';
import type { AdPayload } from '@/lib/types';
import { useBootstrap } from '@/hooks/useBootstrap';

type Props = {
  /** Increment after each completed transit search to evaluate interstitial policy. */
  trigger: number;
  /** Only fire when a search has finished (including zero-result searches). */
  ready: boolean;
};

export function InterstitialOrchestrator({ trigger, ready }: Props) {
  const canShowAds = useCanShowAds();
  const { data: bootstrap } = useBootstrap();
  const enabledModuleKeys = useMemo(
    () => resolveEnabledModules(bootstrap?.island?.enabledModules),
    [bootstrap?.island?.enabledModules],
  );

  const [firstPartyAd, setFirstPartyAd] = useState<AdPayload | null>(null);
  const [showFirstParty, setShowFirstParty] = useState(false);
  const [internalCreative, setInternalCreative] = useState<InternalAdCreative | null>(null);
  const [showInternal, setShowInternal] = useState(false);
  const [showUpsell, setShowUpsell] = useState(false);
  const runningRef = useRef(false);
  const lastTriggerRef = useRef(0);

  const showInternalInterstitial = useCallback((creative: InternalAdCreative) => {
    setInternalCreative(creative);
    setShowInternal(true);
    setInternalFullscreenAdVisible(true);
    markFullScreenAdShown(Date.now());
  }, []);

  const dismissAll = useCallback(() => {
    setShowFirstParty(false);
    setShowInternal(false);
    setShowUpsell(false);
    setFirstPartyAd(null);
    setInternalCreative(null);
    setFirstPartyInterstitialVisible(false);
    setInternalFullscreenAdVisible(false);
    markInterstitialDismissed(Date.now());
  }, []);

  const onInternalDismiss = useCallback(() => {
    setShowInternal(false);
    setInternalCreative(null);
    setInternalFullscreenAdVisible(false);
    setShowUpsell(true);
    markInterstitialDismissed(Date.now());
  }, []);

  useEffect(() => {
    if (!ready || trigger === 0 || trigger === lastTriggerRef.current) {
      return;
    }
    if (!canShowAds) {
      return;
    }
    if (runningRef.current) {
      return;
    }

    lastTriggerRef.current = trigger;
    runningRef.current = true;

    void (async () => {
      try {
        const state = loadInterstitialSessionState();
        const decision = evaluateInterstitialPolicy(state, Date.now(), Math.random());
        if (decision.nextState && Object.keys(decision.nextState).length > 0) {
          persistInterstitialSessionState(decision.nextState);
        }
        if (!decision.show) {
          return;
        }

        const platform = getAdPlatform();
        const ad = await fetchAd({ on: 'interstitial', platform });

        if (ad) {
          setFirstPartyAd(ad);
          setShowFirstParty(true);
          setFirstPartyInterstitialVisible(true);
          markFullScreenAdShown(Date.now());
          track('transit', 'ad_impression', { on: 'interstitial', adId: ad.id });
          return;
        }

        const creative = selectInternalCreative({
          slotKey: 'interstitial:fallback',
          enabledModuleKeys,
        });
        if (creative) {
          showInternalInterstitial(creative);
        } else {
          setShowUpsell(true);
        }
      } finally {
        runningRef.current = false;
      }
    })();
  }, [canShowAds, enabledModuleKeys, ready, showInternalInterstitial, trigger]);

  return (
    <>
      {firstPartyAd ? (
        <FirstPartyInterstitialModal
          visible={showFirstParty}
          ad={firstPartyAd}
          onDismiss={() => {
            dismissAll();
          }}
        />
      ) : null}
      {internalCreative ? (
        <InternalFullscreenModal
          visible={showInternal}
          creative={internalCreative}
          surface="interstitial"
          onDismiss={onInternalDismiss}
        />
      ) : null}
      <PremiumUpsellModal
        visible={showUpsell}
        onDismiss={() => {
          dismissAll();
        }}
      />
    </>
  );
}
