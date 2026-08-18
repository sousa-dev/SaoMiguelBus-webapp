import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowUpDown, Route } from 'lucide-react';

import { Button, CenteredSpinner, EmptyState } from '@/components/ui';
import { Seo } from '@/components/Seo';
import { PageHeader } from '@/components/layout/Page';
import { track } from '@/lib/analytics';

import { MinibusJourneyCard } from './components/MinibusJourneyCard';
import { MinibusStopPicker } from './components/MinibusStopPicker';
import { useMinibusLines, useMinibusNetwork, useMinibusRoute } from './hooks';
import { networkStopNames } from './lib/stops';

export function MinibusSearchPage() {
  const { t } = useTranslation();
  const linesQuery = useMinibusLines();
  const networkQuery = useMinibusNetwork();

  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [submitted, setSubmitted] = useState<{ origin: string; destination: string } | null>(null);

  const stops = useMemo(() => networkStopNames(networkQuery.data), [networkQuery.data]);
  const linesByCode = useMemo(
    () => new Map((linesQuery.data?.lines ?? []).map((line) => [line.code, line])),
    [linesQuery.data],
  );

  const routeQuery = useMinibusRoute(submitted?.origin ?? '', submitted?.destination ?? '', Boolean(submitted));

  useEffect(() => {
    track('minibus', 'view', { screen: 'search' });
  }, []);

  useEffect(() => {
    if (!submitted || routeQuery.isFetching) {
      return;
    }
    track('minibus', 'search', {
      origin: submitted.origin,
      destination: submitted.destination,
      results_count: routeQuery.data?.journeys.length ?? 0,
    });
  }, [submitted, routeQuery.isFetching, routeQuery.data]);

  const onSwap = () => {
    setOrigin(destination);
    setDestination(origin);
  };

  const onSearch = () => {
    const trimmedOrigin = origin.trim();
    const trimmedDestination = destination.trim();
    if (!trimmedOrigin || !trimmedDestination) {
      return;
    }
    setSubmitted({ origin: trimmedOrigin, destination: trimmedDestination });
  };

  const journeys = routeQuery.data?.journeys ?? [];
  const hasSearched = Boolean(submitted);
  const showEmpty = hasSearched && !routeQuery.isFetching && journeys.length === 0;

  return (
    <>
      <Seo modulePath="/minibus/search" />
      <PageHeader title={t('minibusSearchTitle')} subtitle={t('minibusSearchSubtitle')} />

      <div className="flex max-w-xl flex-col gap-4">
        <div className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4">
          <MinibusStopPicker
            value={origin}
            onChange={setOrigin}
            stops={stops}
            placeholder={t('minibusStopPlaceholder')}
            clearLabel={t('clearInput')}
          />

          <div className="flex justify-center">
            <button
              type="button"
              aria-label={t('minibusSwap')}
              onClick={onSwap}
              className="rounded-full border border-border p-2 text-muted hover:text-content"
            >
              <ArrowUpDown size={16} />
            </button>
          </div>

          <MinibusStopPicker
            value={destination}
            onChange={setDestination}
            stops={stops}
            placeholder={t('minibusStopPlaceholder')}
            clearLabel={t('clearInput')}
          />

          <Button
            variant="primary"
            icon={Route}
            onClick={onSearch}
            disabled={!origin.trim() || !destination.trim()}
            className="mt-2"
          >
            {t('minibusSearchCta')}
          </Button>
        </div>

        {routeQuery.isFetching ? <CenteredSpinner /> : null}

        {showEmpty ? (
          <EmptyState title={t('minibusNoJourneys')} description={t('minibusNoJourneysHint')} />
        ) : null}

        {!routeQuery.isFetching && journeys.length > 0 ? (
          <div className="flex flex-col gap-3">
            {journeys.map((journey, index) => (
              <MinibusJourneyCard
                key={`${journey.legs.map((leg) => leg.board.key).join('-')}-${index}`}
                journey={journey}
                linesByCode={linesByCode}
              />
            ))}
          </div>
        ) : null}
      </div>
    </>
  );
}
