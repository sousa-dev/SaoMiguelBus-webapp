import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Map as MapIcon } from 'lucide-react';

import { Card } from '@/components/ui';

/**
 * Network map shortcut, shown alongside the live-tracking entry (only the AzoresBus dataset
 * carries route geometry worth linking to). Fares has its own link in the pre-search
 * instructions block, so it is deliberately not repeated here.
 */
export function TransitMapLinks({ stopsCount }: { stopsCount?: number }) {
  const { t } = useTranslation();
  return (
    <Link to="/transit/network" className="block h-full">
      <Card className="flex h-full items-center gap-3 p-4 hover:bg-surface-variant">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
          <MapIcon size={18} strokeWidth={2} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-content">{t('transitNetworkMap')}</span>
          {stopsCount != null ? (
            <span className="block truncate text-xs text-muted">
              {t('transitNetworkStopsCount', { count: stopsCount, defaultValue: '{{count}} stops' })}
            </span>
          ) : null}
        </span>
      </Card>
    </Link>
  );
}
