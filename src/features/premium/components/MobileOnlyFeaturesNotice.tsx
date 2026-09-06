import { useTranslation } from 'react-i18next';
import { Smartphone } from 'lucide-react';

import { StoreButtons } from '@/components/StoreButtons';
import { Card } from '@/components/ui';

const MOBILE_ONLY_KEYS = [
  'premiumMobileOnlyAlarms',
  'premiumMobileOnlyOffline',
  'premiumMobileOnlyLiveActivities',
  'premiumMobileOnlyRewarded',
];

/** Premium features the browser cannot offer, and the fact that one account unlocks both. */
export function MobileOnlyFeaturesNotice() {
  const { t } = useTranslation();
  return (
    <Card as="section" className="p-5">
      <div className="flex items-start gap-3">
        <Smartphone size={22} className="mt-0.5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold text-content">{t('premiumMobileOnlyTitle')}</h2>
          <p className="mt-1 text-sm text-muted">{t('premiumMobileOnlyBody')}</p>
          <ul className="mt-2 list-disc pl-5 text-sm text-content">
            {MOBILE_ONLY_KEYS.map((key) => (
              <li key={key}>{t(key)}</li>
            ))}
          </ul>
          <StoreButtons className="mt-4" />
        </div>
      </div>
    </Card>
  );
}
