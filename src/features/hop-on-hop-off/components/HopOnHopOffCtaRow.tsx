import { useTranslation } from 'react-i18next';
import { Binoculars, ChevronDown } from 'lucide-react';

import { Badge, Card } from '@/components/ui';
import { trackHopOnOffSheetOpen, type HopOnOffSource } from '@/features/hop-on-hop-off/lib/analytics';
import { useHopOnHopOffModalStore } from '@/features/hop-on-hop-off/lib/modal-store';

/** The sightseeing hop-on-hop-off bus promo — an informational tourist upsell, not premium-related. */
export function HopOnHopOffCtaRow({ source }: { source: HopOnOffSource }) {
  const { t } = useTranslation();

  const onPress = () => {
    trackHopOnOffSheetOpen(source);
    useHopOnHopOffModalStore.getState().openSheet(source);
  };

  return (
    <button type="button" onClick={onPress} className="block w-full text-left">
      <Card className="flex items-center gap-3 border-accent/30 p-4 hover:bg-surface-variant">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
          <Binoculars size={18} strokeWidth={2} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-sm font-bold text-content">{t('hopOnOffCtaTitle')}</span>
            <Badge tone="accent">{t('hopOnOffBadge')}</Badge>
          </span>
          <span className="block truncate text-xs text-muted">{t('hopOnOffCtaSubtitle')}</span>
        </span>
        <ChevronDown size={16} className="-rotate-90 shrink-0 text-muted" />
      </Card>
    </button>
  );
}
