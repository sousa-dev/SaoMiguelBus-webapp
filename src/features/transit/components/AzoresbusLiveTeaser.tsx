import { useTranslation } from 'react-i18next';
import { Radio } from 'lucide-react';

import { Card } from '@/components/ui';
import { openLiveInstallPrompt } from '@/features/ads/lib/live-install-prompt';
import { track } from '@/lib/analytics';

/**
 * Live vehicle tracking is a free native-app feature (mobile's AzoresBus "Ao
 * vivo" map) — the webapp does not implement the map. This teaser sits on the
 * transit hub and hands off to the store, same pattern as MinibusLiveTeaser.
 */
export function AzoresbusLiveTeaser() {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={() => {
        track('transit', 'live_entry_open', { source: 'hub' });
        openLiveInstallPrompt(t('azoresbusLiveInstallTitle'), t('azoresbusLiveInstallBody'));
      }}
      className="w-full text-left"
    >
      <Card className="flex items-center gap-3 p-4 hover:bg-surface-variant">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent">
          <Radio size={18} strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-content">{t('azoresbusLiveCta')}</p>
          <p className="text-xs text-muted">{t('azoresbusLiveCtaHint')}</p>
        </div>
      </Card>
    </button>
  );
}
