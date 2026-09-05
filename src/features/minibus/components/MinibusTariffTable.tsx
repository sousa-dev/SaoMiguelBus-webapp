import { useTranslation } from 'react-i18next';

import { Card } from '@/components/ui';
import { formatAppDate } from '@/lib/format';
import type { MinibusTariff } from '@/lib/types';

export function MinibusTariffTable({
  tariffs,
  effectiveDate,
}: {
  tariffs: MinibusTariff[];
  effectiveDate?: string | null;
}) {
  const { t } = useTranslation();

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-bold text-content">{t('minibusTariffs')}</h2>
        {effectiveDate ? (
          <p className="mt-0.5 text-xs text-muted">
            {t('minibusTariffsEffective', { date: formatAppDate(effectiveDate) })}
          </p>
        ) : null}
      </div>
      <div className="divide-y divide-border">
        {tariffs.map((tariff) => (
          <div key={tariff.key} className="flex items-center justify-between gap-3 px-4 py-2.5">
            <span className="text-sm text-content">{tariff.label}</span>
            <span className="shrink-0 text-sm font-bold text-content">
              {t('minibusPriceEur', { price: tariff.price_eur })}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
