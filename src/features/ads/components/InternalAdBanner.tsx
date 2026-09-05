import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Crown, type LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { openPremiumStore } from '@/features/ads/lib/premium-cta';
import type { InternalAdCreative } from '@/features/ads/lib/internal-ads/types';
import { track } from '@/lib/analytics';
import { getModule } from '@/lib/modules';
import { cn } from '@/lib/cn';

type Props = {
  creative: InternalAdCreative;
  on?: string;
  slot?: string | number;
};

export function InternalAdBanner({ creative, on = 'home', slot = 'top' }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    track('transit', 'internal_ad_impression', {
      on,
      slot,
      creativeId: creative.id,
      kind: creative.kind,
      moduleKey: creative.moduleKey,
      surface: 'banner',
    });
  }, [creative.id, creative.kind, creative.moduleKey, on, slot]);

  const module = creative.moduleKey ? getModule(creative.moduleKey) : undefined;
  const TitleIcon: LucideIcon = creative.kind === 'paywall' ? Crown : (module?.Icon ?? Crown);

  const onPress = () => {
    track('transit', 'internal_ad_click', {
      on,
      slot,
      creativeId: creative.id,
      kind: creative.kind,
      moduleKey: creative.moduleKey,
      surface: 'banner',
    });
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
        'relative flex w-full min-h-14 items-center gap-3 rounded-xl px-4 py-2 text-left transition active:opacity-90',
      )}
      style={{ backgroundColor: creative.backgroundColor }}
    >
      <span className="absolute right-0 top-0 rounded-bl-lg rounded-tr-xl bg-black/20 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white/85">
        {t('transitAdLabel')}
      </span>

      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
        <TitleIcon size={18} color="#FFFFFF" strokeWidth={2.5} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-extrabold text-white">
          {t(creative.titleKey)}
        </span>
        <span className="block truncate text-xs text-white/85">{t(creative.subtitleKey)}</span>
      </span>

      <ChevronRight size={18} color="rgba(255,255,255,0.7)" strokeWidth={2.5} className="shrink-0" />
    </button>
  );
}
