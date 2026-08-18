import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { Card } from '@/components/ui';
import type { MinibusLine } from '@/lib/types';

import { formatServiceSummary } from '../lib/service-summary';

export function MinibusLineCard({ line }: { line: MinibusLine }) {
  const { t } = useTranslation();

  return (
    <Link to={`/minibus/${line.slug}`}>
      <Card className="flex items-center gap-3 p-3 hover:bg-surface-variant">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-[#111]"
          style={{ backgroundColor: line.color }}
        >
          {line.code}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-content">{line.name}</p>
          <p className="truncate text-xs text-muted">{formatServiceSummary(line.service_summary, t)}</p>
        </div>
      </Card>
    </Link>
  );
}
