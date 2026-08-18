import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Route } from 'lucide-react';

import { Card, CenteredSpinner, EmptyState } from '@/components/ui';
import { Seo } from '@/components/Seo';
import { PageHeader } from '@/components/layout/Page';
import { track } from '@/lib/analytics';

import { MinibusAttributionFooter } from './components/MinibusAttributionFooter';
import { MinibusDocumentImage } from './components/MinibusDocumentImage';
import { MinibusLineCard } from './components/MinibusLineCard';
import { MinibusTariffTable } from './components/MinibusTariffTable';
import { useMinibusLines, useMinibusTariffs } from './hooks';

export function MinibusPage() {
  const { t } = useTranslation();
  const linesQuery = useMinibusLines();
  const tariffsQuery = useMinibusTariffs();

  useEffect(() => {
    track('minibus', 'view', { screen: 'list' });
  }, []);

  const loading = linesQuery.isLoading && !linesQuery.data;
  const error = linesQuery.isError && !linesQuery.data;

  return (
    <>
      <Seo modulePath="/minibus" />
      <PageHeader title={t('navBarMinibusLabel')} subtitle={t('minibusSubtitle')} />

      <div className="flex max-w-3xl flex-col gap-6">
        <Link to="/minibus/search">
          <Card className="flex items-center gap-3 p-4 hover:bg-surface-variant">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
              <Route size={18} strokeWidth={2} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-content">{t('minibusPlanRoute')}</p>
              <p className="text-xs text-muted">{t('minibusPlanRouteHint')}</p>
            </div>
          </Card>
        </Link>

        <section>
          <h2 className="mb-3 text-lg font-extrabold text-content">{t('minibusSectionLines')}</h2>

          <div className="mb-4">
            <MinibusDocumentImage
              documentSlug="network-map"
              alt={t('minibusNetworkMapImageAlt')}
              title={t('minibusNetworkMap')}
              tapHint={t('minibusNetworkMapTapToZoom')}
              fullscreenLabel={t('minibusNetworkMapOpenFullscreen')}
              closeLabel={t('close')}
            />
          </div>

          {loading ? <CenteredSpinner /> : null}

          {error ? (
            <EmptyState title={t('minibusLoadError')} />
          ) : null}

          {!loading && !error && linesQuery.data ? (
            <div className="flex flex-col gap-3">
              {linesQuery.data.lines.map((line) => (
                <MinibusLineCard key={line.slug} line={line} />
              ))}
            </div>
          ) : null}
        </section>

        {!loading && !error && tariffsQuery.data ? (
          <section>
            <MinibusTariffTable
              tariffs={tariffsQuery.data.tariffs}
              effectiveDate={tariffsQuery.data.tariffs_effective_date}
            />
          </section>
        ) : null}

        <MinibusAttributionFooter
          sourceUrl={linesQuery.data?.source_url}
          importedAt={linesQuery.data?.imported_at}
        />
      </div>
    </>
  );
}
