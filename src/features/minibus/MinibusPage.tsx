import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Seo } from '@/components/Seo';
import { PageHeader } from '@/components/layout/Page';
import { AdBanner } from '@/features/ads/components/AdBanner';
import { useCanShowAds } from '@/features/premium/usePremium';
import { useNetworkOnline } from '@/lib/hooks/useNetworkOnline';
import { useBootstrap } from '@/hooks/useBootstrap';
import { resolveEnabledModules } from '@/config/island';

import { MinibusAttributionFooter } from './components/MinibusAttributionFooter';
import { MinibusJourneyResultsList } from './components/MinibusJourneyResultsList';
import { MinibusNetworkMapLink } from './components/MinibusNetworkMapLink';
import { MinibusPlannerForm } from './components/MinibusPlannerForm';
import { MinibusPricesLink } from './components/MinibusPricesLink';
import { MinibusTransitLink } from './components/MinibusTransitLink';
import { MinibusLiveEntryCard } from '@/features/minibus/live/components/MinibusLiveEntryCard';
import { useMinibusLines, useMinibusNetwork, useMinibusRouteSearch } from './hooks';
import { networkStopNames } from './lib/stops';

/** `/minibus` — mirrors the mobile MiniBus tab's home screen section order exactly. */
export function MinibusPage() {
  const { t } = useTranslation();
  const isOnline = useNetworkOnline();
  const canShowAds = useCanShowAds();
  const { data: bootstrap } = useBootstrap();
  const linesQuery = useMinibusLines();
  const networkQuery = useMinibusNetwork();
  const search = useMinibusRouteSearch('list');

  const stopsCount = useMemo(() => networkStopNames(networkQuery.data).length, [networkQuery.data]);
  const showTransitLink = resolveEnabledModules(bootstrap?.island?.enabledModules).includes('transit');
  const hasResults = search.journeys.length > 0;

  return (
    <>
      <Seo modulePath="/minibus" />
      <PageHeader title={t('navBarMinibusLabel')} subtitle={t('minibusSubtitle')} />

      <div className="flex max-w-xl flex-col gap-4">
        {canShowAds ? (
          <div className="empty:hidden">
            <AdBanner on="minibus" slot="top" content={hasResults && !search.isFetching} />
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <MinibusNetworkMapLink stopsCount={stopsCount || undefined} />
          <MinibusLiveEntryCard isOnline={isOnline} source="minibus_hub" />
        </div>

        <MinibusPlannerForm
          origin={search.origin}
          onOriginChange={search.setOrigin}
          destination={search.destination}
          onDestinationChange={search.setDestination}
          stops={search.stops}
          onSwap={search.onSwap}
          onSearch={search.onSearch}
        />

        <MinibusJourneyResultsList
          journeys={search.journeys}
          linesByCode={search.linesByCode}
          isFetching={search.isFetching}
          showEmpty={search.showEmpty}
          onViewDirections={search.onViewDirections}
        />

        {!search.hasSearched ? (
          <>
            <MinibusPricesLink />
            {showTransitLink ? <MinibusTransitLink /> : null}
            {canShowAds ? <AdBanner on="minibus" slot="instructions" /> : null}
          </>
        ) : null}

        <MinibusAttributionFooter
          sourceUrl={linesQuery.data?.source_url}
          importedAt={linesQuery.data?.imported_at}
        />
      </div>
    </>
  );
}
