import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Bus, ChevronDown } from 'lucide-react';

import { Card } from '@/components/ui';

/** Cross-link to the AzoresBus hub — the mirror of `minibusTransitLink` on `TransitInstructions`. */
export function MinibusTransitLink() {
  const { t } = useTranslation();
  return (
    <Link to="/transit">
      <Card className="flex items-center gap-3 p-4 hover:bg-surface-variant">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
          <Bus size={18} strokeWidth={2} />
        </span>
        <span className="min-w-0 flex-1 text-sm font-semibold text-content">{t('transitMinibusLink')}</span>
        <ChevronDown size={16} className="-rotate-90 text-muted" />
      </Card>
    </Link>
  );
}
