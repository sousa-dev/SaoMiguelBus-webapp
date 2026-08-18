import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink, Tag } from 'lucide-react';

import { Card, CenteredSpinner, EmptyState } from '@/components/ui';
import { Seo } from '@/components/Seo';
import { BackLink, PageHeader } from '@/components/layout/Page';
import { SchedulePreviewStrip } from '@/features/transit/components/SchedulePreviewNotice';
import { useTariffs } from '@/features/transit/hooks';
import {
  fareBandUnit,
  formatTariffPrice,
  resolveTariffsState,
  tariffInfoLinks,
  tariffRenderer,
} from '@/features/transit/lib/tariffs';
import { track } from '@/lib/analytics';
import { formatAppDate } from '@/lib/format';
import type { Tariff } from '@/lib/types';

function TariffTable({ tariff, locale }: { tariff: Tariff; locale: string }) {
  const { t } = useTranslation();
  const unit = fareBandUnit(tariff);
  const renderer = tariffRenderer(tariff);

  return (
    <div className="border-t border-border px-4 py-3 first:border-t-0">
      <h3 className="text-sm font-bold text-content">{tariff.name}</h3>
      {tariff.note ? <p className="mt-0.5 text-xs text-muted">{tariff.note}</p> : null}

      {renderer === 'single' ? (
        <p className="mt-2 text-lg font-bold text-primary">
          {formatTariffPrice(tariff.prices[0]?.price, locale)}
        </p>
      ) : (
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[16rem] text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-muted">
                <th className="pb-1 pr-4">
                  {/* The bands are distances, and a column of bare numbers is
                      unreadable without saying so. */}
                  {unit
                    ? unit.toLowerCase() === 'km'
                      ? t('transitFaresBandKm')
                      : t('transitFaresBandGeneric', { unit })
                    : t('transitFaresBandGeneric', { unit: '' })}
                </th>
                <th className="pb-1 text-right">{t('transitFaresPriceHeader')}</th>
              </tr>
            </thead>
            <tbody>
              {tariff.prices.map((price, index) => (
                <tr key={`${price.band ?? index}`} className="border-t border-border">
                  {/* A LABEL the operator wrote — never parsed, never sorted. */}
                  <td className="py-1.5 pr-4 text-content">{price.band ?? '—'}</td>
                  <td className="py-1.5 text-right font-semibold text-content">
                    {formatTariffPrice(price.price, locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {unit ? <p className="mt-2 text-xs text-muted">{t('transitFaresDistanceNote')}</p> : null}
        </div>
      )}
    </div>
  );
}

export function PricesPage() {
  const { t, i18n } = useTranslation();
  const tariffs = useTariffs();
  const state = resolveTariffsState(tariffs.data, tariffs.error);

  useEffect(() => {
    if (tariffs.data) {
      track('transit', 'prices_view', { categories: tariffs.data.categories.length });
    }
  }, [tariffs.data]);

  if (tariffs.isLoading) return <CenteredSpinner />;

  const header = (
    <>
      <Seo title={t('transitPricesTitle')} />
      <BackLink to="/transit" label={t('navBarSearchLabel')} />
    </>
  );

  if (state !== 'ready' || !tariffs.data) {
    return (
      <>
        {header}
        <PageHeader title={t('transitPricesTitle')} />
        <EmptyState
          icon={Tag}
          title={state === 'empty' ? t('transitPricesEmpty') : t('transitPricesUnavailable')}
        />
      </>
    );
  }

  const data = tariffs.data;
  const links = tariffInfoLinks(data.infos);

  return (
    <>
      {header}
      <PageHeader
        title={t('transitPricesTitle')}
        subtitle={
          data.effectiveDate
            ? t('transitPricesEffective', { date: formatAppDate(new Date(data.effectiveDate)) })
            : undefined
        }
      />

      {/* A table that only takes effect later carries the same caveat a preview
          search result does. */}
      {data.isFuture ? <SchedulePreviewStrip /> : null}

      {data.notes ? <p className="mb-4 text-sm text-muted">{data.notes}</p> : null}

      <div className="flex max-w-3xl flex-col gap-4">
        {data.categories
          .filter((category) => category.tariffs.length > 0)
          .map((category) => (
            <Card key={category.name} className="overflow-hidden">
              <div className="border-b border-border bg-surface-variant px-4 py-2.5">
                <h2 className="text-sm font-bold text-content">{category.name}</h2>
              </div>
              {category.tariffs.map((tariff) => (
                <TariffTable key={tariff.name} tariff={tariff} locale={i18n.language} />
              ))}
            </Card>
          ))}

        {links.length > 0 ? (
          <Card className="p-4">
            <div className="flex flex-col gap-1.5">
              {links.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                >
                  <ExternalLink size={14} />
                  {link.text}
                </a>
              ))}
            </div>
          </Card>
        ) : null}

        {data.lastUpdatedAt ? (
          <p className="text-xs text-muted">
            {t('transitPricesUpdated', { date: formatAppDate(new Date(data.lastUpdatedAt)) })}
          </p>
        ) : null}
      </div>
    </>
  );
}
