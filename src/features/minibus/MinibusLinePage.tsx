import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { Bus } from 'lucide-react';

import { CenteredSpinner, EmptyState } from '@/components/ui';
import { MapView } from '@/components/MapView';
import { Seo } from '@/components/Seo';
import { BackLink, PageHeader } from '@/components/layout/Page';
import { MINIBUS_LINE_SEO_BY_SLUG } from '@/lib/seo-config';
import { track } from '@/lib/analytics';

import { MinibusAttributionFooter } from './components/MinibusAttributionFooter';
import { MinibusDocumentImage } from './components/MinibusDocumentImage';
import { MinibusLineStopsList } from './components/MinibusLineStopsList';
import { useMinibusLine, useMinibusNetwork } from './hooks';
import { formatServiceSummary } from './lib/service-summary';
import { minibusLineRoute, minibusStopPins } from './lib/line-map-data';

export function MinibusLinePage() {
  const { t } = useTranslation();
  const { slug } = useParams();
  const lineQuery = useMinibusLine(slug);
  const networkQuery = useMinibusNetwork();
  const [highlightedStopKey, setHighlightedStopKey] = useState<string | null>(null);

  const line = lineQuery.data;
  const networkLine = networkQuery.data?.lines.find((row) => row.slug === slug);
  const stops = networkLine?.stops ?? [];

  useEffect(() => {
    if (line) {
      track('minibus', 'view', { screen: 'line', line: line.code });
    }
  }, [line]);

  const loading = lineQuery.isLoading || networkQuery.isLoading;

  if (!line) {
    return (
      <>
        <BackLink to="/minibus" label={t('navBarMinibusLabel')} />
        {loading ? <CenteredSpinner /> : <EmptyState icon={Bus} title={t('minibusLoadError')} />}
      </>
    );
  }

  const seoFallback = slug ? MINIBUS_LINE_SEO_BY_SLUG[slug] : undefined;
  const lineTitle = seoFallback?.title.pt ?? line.name;
  const lineDescription = seoFallback?.description.pt;

  const pins = minibusStopPins(stops, setHighlightedStopKey);
  const routeLines = minibusLineRoute(line.color, line.route_shapes);

  return (
    <>
      <Seo title={lineTitle} description={lineDescription} />
      <BackLink to="/minibus" label={t('navBarMinibusLabel')} />
      <PageHeader
        title={line.name}
        subtitle={formatServiceSummary(line.service_summary, t)}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
        <div
          className="h-96 overflow-hidden rounded-2xl border border-border"
          aria-label={t('minibusLineMapA11y', { line: line.code })}
        >
          {routeLines.length === 0 && pins.length === 0 ? (
            <div className="flex h-full items-center justify-center p-6">
              <p className="text-sm text-muted">{t('minibusLoadError')}</p>
            </div>
          ) : (
            <MapView points={pins} lines={routeLines} />
          )}
        </div>

        <MinibusLineStopsList
          stops={stops}
          lineColor={line.color}
          selectedStopKey={highlightedStopKey}
          onStopClick={setHighlightedStopKey}
        />
      </div>

      <div className="mt-6 max-w-3xl">
        <MinibusDocumentImage
          documentSlug={line.slug}
          alt={t('minibusTimetableImageAlt', { line: line.name })}
          title={t('minibusTimetable')}
          tapHint={t('minibusTimetableTapToZoom')}
          fullscreenLabel={t('minibusTimetableOpenFullscreen', { line: line.name })}
          closeLabel={t('close')}
        />
      </div>

      <MinibusAttributionFooter sourceUrl={line.source_url} importedAt={line.imported_at} />
    </>
  );
}
