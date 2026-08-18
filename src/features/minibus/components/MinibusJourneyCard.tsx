import { ArrowRight, ArrowUpDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Card } from '@/components/ui';
import type { MinibusJourney, MinibusLine } from '@/lib/types';

import { formatServiceSummary } from '../lib/service-summary';

export function MinibusJourneyCard({
  journey,
  linesByCode,
}: {
  journey: MinibusJourney;
  linesByCode: Map<string, MinibusLine>;
}) {
  const { t } = useTranslation();

  const summary =
    journey.transfers === 0
      ? t('minibusDirectJourney')
      : t('minibusTransfersCount', { count: journey.transfers });

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-content">{summary}</span>
        <span className="text-xs text-muted">{t('minibusStopsCount', { count: journey.total_stops })}</span>
      </div>

      {journey.legs.map((leg, index) => {
        const line = linesByCode.get(leg.line_code);
        const hours = line ? formatServiceSummary(line.service_summary, t) : '';

        return (
          <div key={`${leg.line_code}-${leg.board.key}`}>
            {index > 0 ? (
              <div className="mb-2 flex items-center gap-1.5 pl-8 text-xs text-muted">
                <ArrowUpDown size={13} />
                {t('minibusTransferAt', { stop: journey.transfer_stops[index - 1]?.name ?? leg.board.name })}
              </div>
            ) : null}
            <div className="flex items-start gap-3">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold text-[#111]"
                style={{ backgroundColor: leg.line_color ?? '#218732' }}
              >
                {leg.line_code}
              </span>
              <div className="min-w-0 flex-1">
                {leg.line_name ? (
                  <p className="text-sm font-semibold text-content">{leg.line_name}</p>
                ) : null}
                {hours ? <p className="text-xs text-muted">{hours}</p> : null}
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-sm text-content">
                  <span>{leg.board.name}</span>
                  <ArrowRight size={13} className="shrink-0 text-muted" />
                  <span>{leg.alight.name}</span>
                </div>
                <p className="mt-0.5 text-xs text-muted">
                  {t('minibusStopsCount', { count: leg.num_stops })}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </Card>
  );
}
