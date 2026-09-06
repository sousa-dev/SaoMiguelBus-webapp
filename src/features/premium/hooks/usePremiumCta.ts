import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { premiumRoute } from '@/features/premium/lib/paywall-route';

/** Every "remove ads / go premium" CTA lands on the paywall page, tagged with where it came from. */
export function usePremiumCta() {
  const navigate = useNavigate();
  return useCallback((source: string) => navigate(premiumRoute(source)), [navigate]);
}
