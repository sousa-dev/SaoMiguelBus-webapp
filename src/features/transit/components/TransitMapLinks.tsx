import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Map as MapIcon, Tag } from 'lucide-react';

import { Card } from '@/components/ui';

/**
 * Network map and fares shortcuts, shown alongside the live-tracking entry on the AzoresBus
 * network (only that dataset carries route geometry and a fare table worth linking to).
 */
export function TransitMapLinks({ stopsCount }: { stopsCount?: number }) {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-2 gap-3">
      <Link to="/transit/network">
        <Card className="flex h-full items-center gap-3 p-4 hover:bg-surface-variant">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
            <MapIcon size={18} strokeWidth={2} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold text-content">{t('transitNetworkMap')}</span>
            {stopsCount != null ? (
              <span className="block text-xs text-muted">
                {t('transitNetworkStopsCount', { count: stopsCount, defaultValue: '{{count}} stops' })}
              </span>
            ) : null}
          </span>
        </Card>
      </Link>
      <Link to="/transit/prices">
        <Card className="flex h-full items-center gap-3 p-4 hover:bg-surface-variant">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
            <Tag size={18} strokeWidth={2} />
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-bold text-content">
            {t('transitPricesTitle')}
          </span>
        </Card>
      </Link>
    </div>
  );
}
