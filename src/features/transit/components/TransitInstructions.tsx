import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { BusFront, ChevronDown, Tag } from 'lucide-react';

import { Card } from '@/components/ui';
import { AdBanner } from '@/features/ads/components/AdBanner';
import { HopOnHopOffCtaRow } from '@/features/hop-on-hop-off/components/HopOnHopOffCtaRow';
import { useCanShowAds } from '@/features/premium/usePremium';

/**
 * The "no search yet" block: what the page is for, plus the two shortcuts a rider without an
 * origin/destination in mind is most likely to want (fares, Mini Bus), and a house/network ad.
 */
export function TransitInstructions() {
  const { t } = useTranslation();
  const canShowAds = useCanShowAds();

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-6">
        <h3 className="mb-1 text-lg font-bold text-content">{t('homeInstructionsTitle')}</h3>
        <p className="text-sm text-muted">{t('homeInstructionsText')}</p>
        <p className="mt-2 text-sm text-muted">{t('homeInstructionsText2')}</p>
      </Card>

      <Link to="/transit/prices">
        <Card className="flex items-center gap-3 p-4 hover:bg-surface-variant">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
            <Tag size={18} strokeWidth={2} />
          </span>
          <span className="min-w-0 flex-1 text-sm font-semibold text-content">
            {t('transitPricesTitle')}
          </span>
          <ChevronDown size={16} className="-rotate-90 text-muted" />
        </Card>
      </Link>

      <Link to="/minibus">
        <Card className="flex items-center gap-3 p-4 hover:bg-surface-variant">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f47216]/12 text-[#f47216]">
            <BusFront size={18} strokeWidth={2} />
          </span>
          <span className="min-w-0 flex-1 text-sm font-semibold text-content">
            {t('minibusTransitLink')}
          </span>
          <ChevronDown size={16} className="-rotate-90 text-muted" />
        </Card>
      </Link>

      <HopOnHopOffCtaRow source="transit" />

      {canShowAds ? <AdBanner on="home" slot="instructions" /> : null}
    </div>
  );
}
