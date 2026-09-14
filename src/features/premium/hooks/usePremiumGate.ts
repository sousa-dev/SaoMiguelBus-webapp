import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { premiumRoute } from '@/features/premium/lib/paywall-route';
import { openPremiumGateDialog, type PremiumFeature } from '@/features/premium/lib/premium-gate-dialog-store';
import { usePremium } from '@/features/premium/usePremium';

/**
 * Gate for premium *actions* (start a track, pin a route). Premium → run it; free → a short
 * explainer of what the button does (marked as a premium feature) whose only exit, Continue,
 * lands on the paywall with the source. Mirrors the Expo `usePremiumGate`, minus the in-place
 * paywall sheet.
 */
export function usePremiumGate() {
  const isPremium = usePremium();
  const navigate = useNavigate();

  const guardPremiumAction = useCallback(
    (action: () => void, source: string, feature: PremiumFeature) => {
      if (isPremium) {
        action();
        return true;
      }
      openPremiumGateDialog({
        feature,
        source,
        onContinue: () => navigate(premiumRoute(source)),
      });
      return false;
    },
    [isPremium, navigate],
  );

  return { isPremium, guardPremiumAction };
}
