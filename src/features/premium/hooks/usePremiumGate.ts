import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { premiumRoute } from '@/features/premium/lib/paywall-route';
import { usePremium } from '@/features/premium/usePremium';

/**
 * Gate for premium *actions* (start a track, pin a route). Premium → run it; free → land on the
 * paywall with the source. Mirrors the Expo `usePremiumGate`, minus the in-place paywall sheet.
 */
export function usePremiumGate() {
  const isPremium = usePremium();
  const navigate = useNavigate();

  const guardPremiumAction = useCallback(
    (action: () => void, source: string) => {
      if (isPremium) {
        action();
        return true;
      }
      navigate(premiumRoute(source));
      return false;
    },
    [isPremium, navigate],
  );

  return { isPremium, guardPremiumAction };
}
