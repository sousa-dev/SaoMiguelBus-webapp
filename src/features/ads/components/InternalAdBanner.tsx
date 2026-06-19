import { useTranslation } from 'react-i18next';
import { Crown, Hand, type LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { openPremiumStore } from '@/features/ads/lib/premium-cta';
import type { InternalAdCreative } from '@/features/ads/lib/internal-ads/types';
import { getModule } from '@/lib/modules';
import { cn } from '@/lib/cn';

type Props = {
  creative: InternalAdCreative;
  on?: string;
  slot?: string | number;
};

export function InternalAdBanner({ creative }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const module = creative.moduleKey ? getModule(creative.moduleKey) : undefined;
  const TitleIcon: LucideIcon = creative.kind === 'paywall' ? Crown : (module?.Icon ?? Crown);
  const HintIcon: LucideIcon = creative.kind === 'paywall' ? Hand : (module?.Icon ?? Crown);

  const onPress = () => {
    if (creative.kind === 'paywall') {
      openPremiumStore();
      return;
    }
    if (module?.route) {
      navigate(module.route);
    }
  };

  return (
    <button
      type="button"
      onClick={onPress}
      aria-label={`${t(creative.titleKey)}. ${t(creative.subtitleKey)}`}
      className={cn(
        'relative w-full rounded-2xl px-4 py-4 text-center transition active:opacity-90',
        'min-h-[44px]',
      )}
      style={{ backgroundColor: creative.backgroundColor }}
    >
      <span className="absolute left-0 top-0 rounded-br-lg bg-primary px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-on-primary">
        {t('transitAdLabel')}
      </span>

      <div className="mb-1 flex w-full items-center justify-center gap-2">
        <TitleIcon size={20} color="#FFFFFF" strokeWidth={2.5} className="shrink-0" />
        <span className="text-center text-base font-extrabold uppercase tracking-wide text-white">
          {t(creative.titleKey)}
        </span>
      </div>

      <p className="text-center text-sm text-white/90">{t(creative.subtitleKey)}</p>

      {creative.hintKey ? (
        <div className="mt-2 flex items-center justify-center gap-1">
          <HintIcon size={12} color="rgba(255,255,255,0.85)" strokeWidth={2} />
          <span className="text-[11px] text-white/80">{t(creative.hintKey)}</span>
        </div>
      ) : null}
    </button>
  );
}
