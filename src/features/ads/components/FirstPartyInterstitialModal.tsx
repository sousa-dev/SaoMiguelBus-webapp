import { Crown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { openPremiumStore } from '@/features/ads/lib/premium-cta';
import { resolveAdHref } from '@/features/ads/lib/ad-link';
import { recordAdClick } from '@/lib/api';
import type { AdPayload } from '@/lib/types';
import { Button } from '@/components/ui';

type Props = {
  visible: boolean;
  ad: AdPayload;
  onDismiss: () => void;
};

export function FirstPartyInterstitialModal({ visible, ad, onDismiss }: Props) {
  const { t } = useTranslation();

  if (!visible) return null;

  const onAdPress = () => {
    void recordAdClick(ad.id);
    const href = resolveAdHref(ad);
    if (href) {
      window.open(href, '_blank', 'noopener,noreferrer');
    }
  };

  const onUpgrade = () => {
    onDismiss();
    openPremiumStore();
  };

  return (
    <div
      className="fixed inset-0 z-[1300] flex flex-col bg-background lg:items-center lg:justify-center lg:bg-black/55 lg:p-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex min-h-full w-full flex-col bg-background lg:max-h-[90vh] lg:min-h-0 lg:max-w-2xl lg:overflow-hidden lg:rounded-3xl lg:shadow-2xl">
        <div className="flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] lg:px-6">
          <span className="rounded-md bg-primary px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-on-primary">
            {t('transitAdLabel')}
          </span>
          <button
            type="button"
            onClick={onDismiss}
            aria-label={t('close', { defaultValue: 'Close' })}
            className="flex h-11 w-11 items-center justify-center text-3xl font-light text-muted"
          >
            ×
          </button>
        </div>

        <button
          type="button"
          onClick={onAdPress}
          className="mx-4 my-4 flex flex-1 items-center justify-center lg:mx-6"
        >
          <img
            src={ad.media}
            alt={ad.entity || t('transitAdLabel')}
            className="max-h-[420px] w-full rounded-2xl object-contain"
          />
        </button>

        <div className="flex flex-col items-center gap-2 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] lg:px-6">
          <div className="flex items-center gap-2">
            <Crown size={22} className="text-accent" strokeWidth={2.5} />
            <p className="text-base font-bold text-content">
              {t('upgradeForBetterTitle', { defaultValue: 'Upgrade for a better experience' })}
            </p>
          </div>
          <p className="text-center text-sm text-muted">{t('interstitialAdDescription')}</p>
          <Button className="mt-1 w-full" onClick={onUpgrade}>
            {t('upgradeNowButton')}
          </Button>
          <button type="button" onClick={onDismiss} className="py-2 text-sm text-muted">
            {t('continueWithAdsButton')}
          </button>
        </div>
      </div>
    </div>
  );
}
