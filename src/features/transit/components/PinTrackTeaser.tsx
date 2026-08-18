import { useTranslation } from 'react-i18next';
import { Pin } from 'lucide-react';

import { openPremiumStore } from '@/features/ads/lib/premium-cta';
import { track } from '@/lib/analytics';
import type { TransitJourney } from '@/lib/types';

/**
 * Pinning and tracking a journey are premium, and premium is a MOBILE feature —
 * there is no in-web paywall and no account to attach an entitlement to, so the
 * webapp does not implement either. What it does instead is say they exist,
 * attached to the journey a rider was actually looking at, and hand off to the
 * store.
 *
 * `openPremiumStore` already routes a desktop visitor to the store chooser and a
 * phone straight to the right store, so there is nothing platform-specific here.
 */
export function PinTrackTeaser({ journey }: { journey: TransitJourney }) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={(event) => {
        // The card body toggles expansion; this is its own action.
        event.stopPropagation();
        track('transit', 'premium_teaser_click', {
          feature: 'pin_track',
          journey_id: journey.id,
          transfers: journey.transfers,
        });
        openPremiumStore();
      }}
      title={t('premiumFeatureBusTracking')}
      className="flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-semibold text-muted hover:bg-surface-variant hover:text-primary"
    >
      <Pin size={15} />
      <span className="hidden sm:inline">{t('pinnedRoutes')}</span>
    </button>
  );
}
