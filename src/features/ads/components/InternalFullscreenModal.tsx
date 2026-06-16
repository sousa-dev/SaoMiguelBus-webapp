import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Crown, Hand, type LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { INTERNAL_AD_CLOSE_DELAY_SEC } from '@/features/ads/lib/internal-ad-constants';
import { openPremiumStore } from '@/features/ads/lib/premium-cta';
import type { InternalAdCreative, InternalAdSurface } from '@/features/ads/lib/internal-ads/types';
import { getModule } from '@/lib/modules';
import { Button } from '@/components/ui';
import { cn } from '@/lib/cn';

type Props = {
  visible: boolean;
  creative: InternalAdCreative;
  surface: InternalAdSurface;
  onDismiss: () => void;
};

export function InternalFullscreenModal({ visible, creative, surface, onDismiss }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [secondsLeft, setSecondsLeft] = useState(INTERNAL_AD_CLOSE_DELAY_SEC);

  const module = creative.moduleKey ? getModule(creative.moduleKey) : undefined;
  const TitleIcon: LucideIcon = creative.kind === 'paywall' ? Crown : (module?.Icon ?? Crown);
  const HintIcon: LucideIcon = creative.kind === 'paywall' ? Hand : (module?.Icon ?? Crown);
  const canClose = secondsLeft <= 0;
  const isInterstitial = surface === 'interstitial';

  useEffect(() => {
    if (!visible) {
      return;
    }

    // Reset countdown each time the modal opens (matches mobile interstitial timing).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional open reset
    setSecondsLeft(INTERNAL_AD_CLOSE_DELAY_SEC);
    const interval = setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [visible, creative.id]);

  const onPrimaryPress = () => {
    if (creative.kind === 'paywall') {
      onDismiss();
      openPremiumStore();
      return;
    }
    if (module?.route) {
      onDismiss();
      navigate(module.route);
    }
  };

  if (!visible) return null;

  if (isInterstitial) {
    return (
      <div
        className="fixed inset-0 z-[1300] flex flex-col lg:items-center lg:justify-center lg:bg-black/55 lg:p-6"
        style={{ backgroundColor: creative.backgroundColor }}
        role="dialog"
        aria-modal="true"
      >
        <div
          className={cn(
            'flex min-h-full w-full flex-col px-4 lg:min-h-0 lg:max-h-[90vh] lg:max-w-2xl lg:overflow-hidden lg:rounded-3xl lg:shadow-2xl',
          )}
          style={{ backgroundColor: creative.backgroundColor }}
        >
          <div className="flex items-center justify-between pt-[max(0.75rem,env(safe-area-inset-top))]">
            <span className="rounded-md bg-primary px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-on-primary">
              {t('transitAdLabel')}
            </span>
            <button
              type="button"
              onClick={canClose ? onDismiss : undefined}
              disabled={!canClose}
              aria-label={
                canClose
                  ? t('close', { defaultValue: 'Close' })
                  : t('internalAdCloseInSeconds', { seconds: secondsLeft })
              }
              className="flex h-11 w-11 items-center justify-center text-3xl font-bold text-white"
            >
              {canClose ? '×' : secondsLeft}
            </button>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
            <TitleIcon size={56} color="#FFFFFF" strokeWidth={2.5} />
            <h2 className="text-2xl font-extrabold uppercase tracking-wide text-white lg:text-[28px]">
              {t(creative.titleKey)}
            </h2>
            <p className="text-base text-white/90 lg:text-lg">{t(creative.subtitleKey)}</p>
            {creative.hintKey ? (
              <div className="flex items-center gap-1.5">
                <HintIcon size={16} color="rgba(255,255,255,0.85)" strokeWidth={2} />
                <span className="text-sm text-white/85">{t(creative.hintKey)}</span>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {!canClose ? (
              <p className="text-center text-xs text-white/85">
                {t('internalAdCloseInSeconds', { seconds: secondsLeft })}
              </p>
            ) : null}
            <Button className="w-full" onClick={onPrimaryPress}>
              {creative.kind === 'paywall' ? t('upgradeNowButton') : t('internalAdExploreButton')}
            </Button>
            <button
              type="button"
              onClick={canClose ? onDismiss : undefined}
              disabled={!canClose}
              className="py-2 text-sm text-white/80 disabled:opacity-50"
            >
              {t('continueWithAdsButton')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/55 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-5 shadow-xl">
        <button
          type="button"
          onClick={canClose ? onDismiss : undefined}
          disabled={!canClose}
          aria-label={
            canClose
              ? t('close', { defaultValue: 'Close' })
              : t('internalAdCloseInSeconds', { seconds: secondsLeft })
          }
          className="ml-auto flex h-8 w-8 items-center justify-center text-2xl font-bold text-muted disabled:text-border"
        >
          {canClose ? '×' : secondsLeft}
        </button>

        <div
          className="mb-4 rounded-2xl p-5 text-center"
          style={{ backgroundColor: creative.backgroundColor }}
        >
          <div className="mb-2 flex items-center justify-center gap-2">
            <TitleIcon size={28} color="#FFFFFF" strokeWidth={2.5} />
            <span className="text-lg font-extrabold uppercase text-white">{t(creative.titleKey)}</span>
          </div>
          <p className="text-sm text-white/90">{t(creative.subtitleKey)}</p>
          {creative.hintKey ? (
            <div className="mt-2 flex items-center justify-center gap-1">
              <HintIcon size={14} color="rgba(255,255,255,0.85)" strokeWidth={2} />
              <span className="text-xs text-white/85">{t(creative.hintKey)}</span>
            </div>
          ) : null}
        </div>

        {!canClose ? (
          <p className="mb-3 text-center text-xs text-muted">
            {t('internalAdCloseInSeconds', { seconds: secondsLeft })}
          </p>
        ) : null}

        <Button className="mb-2 w-full" onClick={onPrimaryPress}>
          {creative.kind === 'paywall' ? t('upgradeNowButton') : t('internalAdExploreButton')}
        </Button>
        <button
          type="button"
          onClick={canClose ? onDismiss : undefined}
          disabled={!canClose}
          className="w-full py-2 text-sm text-muted disabled:opacity-50"
        >
          {t('continueWithAdsButton')}
        </button>
      </div>
    </div>
  );
}
