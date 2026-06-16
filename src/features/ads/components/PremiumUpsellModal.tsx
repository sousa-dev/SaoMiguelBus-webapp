import { Crown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { openPremiumStore } from '@/features/ads/lib/premium-cta';
import { Button } from '@/components/ui';

type Props = {
  visible: boolean;
  onDismiss: () => void;
};

/** Shown after an internal interstitial closes — store upsell (no in-web paywall). */
export function PremiumUpsellModal({ visible, onDismiss }: Props) {
  const { t } = useTranslation();

  if (!visible) return null;

  const onUpgrade = () => {
    onDismiss();
    openPremiumStore();
  };

  return (
    <div
      className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/55 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-5 text-center shadow-xl">
        <button
          type="button"
          onClick={onDismiss}
          aria-label={t('close', { defaultValue: 'Close' })}
          className="ml-auto flex h-8 w-8 items-center justify-center text-2xl text-muted"
        >
          ×
        </button>

        <div className="mb-3 flex items-center justify-center gap-2">
          <Crown size={22} className="text-accent" strokeWidth={2.5} />
          <h2 className="text-lg font-bold text-content">{t('removeAdsTitle')}</h2>
        </div>
        <p className="mb-1 text-sm text-muted">{t('interstitialAdDescription')}</p>
        <p className="mb-4 text-xs text-muted">{t('removeAdsBannerSubtitle')}</p>

        <Button className="mb-2 w-full" onClick={onUpgrade}>
          {t('upgradeNowButton')}
        </Button>
        <button type="button" onClick={onDismiss} className="w-full py-2 text-sm text-muted">
          {t('continueWithAdsButton')}
        </button>
      </div>
    </div>
  );
}
