import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ChevronDown, Ticket } from 'lucide-react';

import { Card } from '@/components/ui';

/** Shortcut card to the standalone fares page — mirrors mobile's hub (no inline tariff table). */
export function MinibusPricesLink() {
  const { t } = useTranslation();
  return (
    <Link to="/minibus/prices">
      <Card className="flex items-center gap-3 p-4 hover:bg-surface-variant">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
          <Ticket size={18} strokeWidth={2} />
        </span>
        <span className="min-w-0 flex-1 text-sm font-semibold text-content">{t('minibusTariffs')}</span>
        <ChevronDown size={16} className="-rotate-90 text-muted" />
      </Card>
    </Link>
  );
}
