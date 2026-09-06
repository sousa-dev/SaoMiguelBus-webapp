import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Map as MapIcon } from 'lucide-react';

import { Card } from '@/components/ui';

/** Shortcut into the interactive stops map — the schematic image stays below for reference. */
export function MinibusNetworkMapLink() {
  const { t } = useTranslation();
  return (
    <Link to="/minibus/network" className="block">
      <Card className="flex items-center gap-3 p-4 hover:bg-surface-variant">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
          <MapIcon size={18} strokeWidth={2} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-content">{t('minibusNetworkOpenMap')}</span>
        </span>
      </Card>
    </Link>
  );
}
