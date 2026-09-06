import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Map as MapIcon } from 'lucide-react';

import { Card } from '@/components/ui';

/** Shortcut into the interactive stops map (which also carries the line list / schematic). */
export function MinibusNetworkMapLink({ stopsCount }: { stopsCount?: number }) {
  const { t } = useTranslation();
  return (
    <Link to="/minibus/network" className="block h-full">
      <Card className="flex h-full items-center gap-3 p-4 hover:bg-surface-variant">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f47216]/12 text-[#f47216]">
          <MapIcon size={18} strokeWidth={2} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-content">{t('minibusNetworkOpenMap')}</span>
          {stopsCount != null ? (
            <span className="block truncate text-xs text-muted">{t('minibusStopsCount', { count: stopsCount })}</span>
          ) : null}
        </span>
      </Card>
    </Link>
  );
}
