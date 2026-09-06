import { useTranslation } from 'react-i18next';
import { Crown } from 'lucide-react';

import { Badge } from '@/components/ui';
import { daysRemaining } from '@/features/premium/lib/days-remaining';
import { useEntitlement, usePremium } from '@/features/premium/usePremium';

/** Crown pill shown next to the profile. Non-renewing passes count down their remaining days. */
export function PremiumBadge() {
  const { t } = useTranslation();
  const isPremium = usePremium();
  const entitlement = useEntitlement();
  if (!isPremium) return null;

  const countdown =
    entitlement?.status !== 'active' ? daysRemaining(entitlement?.currentPeriodEnd) : null;
  const label =
    countdown != null
      ? t('premiumBadgeDaysLeft', { count: countdown })
      : t('premiumHeaderButtonActive');

  return (
    <span data-testid="premium-badge">
      <Badge tone="accent">
        <Crown size={12} strokeWidth={2.5} />
        {label}
      </Badge>
    </span>
  );
}
