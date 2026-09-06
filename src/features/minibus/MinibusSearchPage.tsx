import { useTranslation } from 'react-i18next';

import { Seo } from '@/components/Seo';
import { PageHeader } from '@/components/layout/Page';

import { MinibusJourneyResultsList } from './components/MinibusJourneyResultsList';
import { MinibusPlannerForm } from './components/MinibusPlannerForm';
import { useMinibusRouteSearch } from './hooks';

export function MinibusSearchPage() {
  const { t } = useTranslation();
  const search = useMinibusRouteSearch('search');

  return (
    <>
      <Seo modulePath="/minibus/search" />
      <PageHeader title={t('minibusSearchTitle')} subtitle={t('minibusSearchSubtitle')} />

      <div className="flex max-w-xl flex-col gap-4">
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
      </div>
    </>
  );
}
