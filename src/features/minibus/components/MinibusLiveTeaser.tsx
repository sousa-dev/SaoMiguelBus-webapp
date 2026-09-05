import { useTranslation } from 'react-i18next';
import { Radio } from 'lucide-react';

import { Card } from '@/components/ui';
import { openLiveInstallPrompt } from '@/features/ads/lib/live-install-prompt';
import { track } from '@/lib/analytics';

/**
 * Live vehicle tracking is a free native-app feature — the webapp does not
 * implement the map. This teaser sits next to the plan-route card the rider
 * was already looking at and hands off to the store (same pattern as
 * PinTrackTeaser, but with Mini-Bus-specific copy so desktop visitors are
 * not told to "Remove Ads").
 */
export function MinibusLiveTeaser() {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={() => {
        track('minibus', 'live_entry_open', { source: 'hub' });
        openLiveInstallPrompt(t('minibusLiveInstallTitle'), t('minibusLiveInstallBody'));
      }}
      className="w-full text-left"
    >
      <Card className="flex items-center gap-3 p-4 hover:bg-surface-variant">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent">
          <Radio size={18} strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-content">{t('minibusLiveCta')}</p>
          <p className="text-xs text-muted">{t('minibusLiveCtaHint')}</p>
        </div>
      </Card>
    </button>
  );
}
