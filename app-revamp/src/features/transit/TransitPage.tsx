import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRightLeft, Bus, Clock, Route as RouteIcon, Search, Star } from 'lucide-react';

import { Button, Card, CenteredSpinner, EmptyState } from '@/components/ui';
import { PageHeader } from '@/components/layout/Page';
import { useBootstrap } from '@/hooks/useBootstrap';
import { resolveDayType } from '@/lib/format';
import { useProfileStore } from '@/lib/store';
import { RouteCard, StopPicker } from '@/features/transit/components';
import { useStops, useTransitSearch } from '@/features/transit/hooks';

const DEFAULT_SEARCH_TIME = '00:00';

function todayInputValue(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function TransitPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { data: bootstrap } = useBootstrap();
  const { data: stops = [], isLoading: stopsLoading } = useStops();

  const recentSearches = useProfileStore((s) => s.recentSearches);
  const addRecentSearch = useProfileStore((s) => s.addRecentSearch);
  const favoriteRoutes = useProfileStore((s) => s.favoriteRoutes);

  const [origin, setOrigin] = useState(params.get('origin') ?? '');
  const [destination, setDestination] = useState(params.get('destination') ?? '');
  const [dateStr, setDateStr] = useState(todayInputValue());
  const [time, setTime] = useState(DEFAULT_SEARCH_TIME);
  const [searchEnabled, setSearchEnabled] = useState(Boolean(params.get('origin') && params.get('destination')));

  const day = useMemo(
    () => resolveDayType(new Date(`${dateStr}T00:00:00`), bootstrap?.holidays),
    [dateStr, bootstrap?.holidays],
  );

  const searchParams = useMemo(
    () => ({
      origin,
      destination,
      day,
      start: time.replace(':', 'h'),
      enabled: searchEnabled && Boolean(origin && destination),
    }),
    [origin, destination, day, time, searchEnabled],
  );

  const search = useTransitSearch(searchParams);

  useEffect(() => {
    if (search.data && search.data.length > 0 && searchEnabled) {
      addRecentSearch({ origin, destination, day, time });
    }
  }, [search.data, searchEnabled, origin, destination, day, time, addRecentSearch]);

  const runSearch = () => {
    if (!origin || !destination) return;
    setSearchEnabled(true);
    setParams({ origin, destination }, { replace: true });
    void search.refetch();
  };

  const swap = () => {
    setOrigin(destination);
    setDestination(origin);
  };

  const apply = (o: string, d: string) => {
    setOrigin(o);
    setDestination(d);
    setSearchEnabled(true);
    setParams({ origin: o, destination: d }, { replace: true });
  };

  const hasResults = Boolean(search.data && search.data.length > 0);
  const showEmpty = searchEnabled && !search.isFetching && search.data && search.data.length === 0;

  return (
    <>
      <PageHeader title={t('navBarSearchLabel')} subtitle={t('homeInstructionsTitle')} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
        {/* Planner column */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          <Card className="p-5">
            <div className="flex flex-col gap-3">
              <StopPicker value={origin} onChange={setOrigin} stops={stops} placeholder={t('originPlaceholder', { defaultValue: 'Origin' })} />
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={swap}
                  className="rounded-full border border-border bg-surface p-2 text-muted hover:text-primary"
                  aria-label="swap"
                >
                  <ArrowRightLeft size={16} className="rotate-90" />
                </button>
              </div>
              <StopPicker value={destination} onChange={setDestination} stops={stops} placeholder={t('destinationPlaceholder', { defaultValue: 'Destination' })} />

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
                  {t('dateLabel', { defaultValue: 'Date' })}
                  <input
                    type="date"
                    value={dateStr}
                    onChange={(e) => setDateStr(e.target.value)}
                    className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-content focus:border-primary focus:outline-none"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
                  <span className="inline-flex items-center gap-1"><Clock size={12} /> {t('timeLabel', { defaultValue: 'Time' })}</span>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-content focus:border-primary focus:outline-none"
                  />
                </label>
              </div>

              <div className="flex gap-2">
                <Button icon={Search} className="flex-1" onClick={runSearch} disabled={!origin || !destination}>
                  {t('searchButton', { defaultValue: 'Search' })}
                </Button>
                <Button
                  variant="outline"
                  icon={RouteIcon}
                  onClick={() =>
                    navigate(`/transit/directions?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&start=${time.replace(':', 'h')}`)
                  }
                  disabled={!origin || !destination}
                >
                  {t('navBarRoutesLabel', { defaultValue: 'Directions' })}
                </Button>
              </div>
            </div>
          </Card>

          {favoriteRoutes.length > 0 ? (
            <Card className="p-4">
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-content">
                <Star size={15} className="text-accent" /> {t('favoritesTitle', { defaultValue: 'Favorites' })}
              </h3>
              <div className="flex flex-col gap-1.5">
                {favoriteRoutes.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => apply(r.origin, r.destination)}
                    className="rounded-lg px-2 py-1.5 text-left text-sm text-content hover:bg-surface-variant"
                  >
                    {r.origin} → {r.destination}
                  </button>
                ))}
              </div>
            </Card>
          ) : null}

          {recentSearches.length > 0 ? (
            <Card className="p-4">
              <h3 className="mb-2 text-sm font-bold text-content">{t('recentSearchesTitle', { defaultValue: 'Recent searches' })}</h3>
              <div className="flex flex-col gap-1.5">
                {recentSearches.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => apply(r.origin, r.destination)}
                    className="rounded-lg px-2 py-1.5 text-left text-sm text-content hover:bg-surface-variant"
                  >
                    {r.origin} → {r.destination}
                  </button>
                ))}
              </div>
            </Card>
          ) : null}
        </div>

        {/* Results column */}
        <div className="flex flex-col gap-4">
          {!searchEnabled && !hasResults ? (
            <Card className="p-6">
              <h3 className="mb-1 text-lg font-bold text-content">{t('homeInstructionsTitle')}</h3>
              <p className="text-sm text-muted">{t('homeInstructionsText')}</p>
              <p className="mt-2 text-sm text-muted">{t('homeInstructionsText2')}</p>
            </Card>
          ) : null}

          {search.isFetching ? <CenteredSpinner /> : null}

          {showEmpty ? (
            <EmptyState
              icon={Bus}
              title={t('noRoutesMessage', { origin, destination })}
              description={t('noRoutesSubtitle')}
              actionLabel={t('tryDirectionsButton')}
              onAction={() =>
                navigate(`/transit/directions?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&start=${time.replace(':', 'h')}`)
              }
            />
          ) : null}

          {hasResults && !search.isFetching
            ? search.data!.map((r) => <RouteCard key={r.id} result={r} />)
            : null}

          {stopsLoading && !searchEnabled ? <p className="text-sm text-muted">{t('loading', { defaultValue: 'Loading…' })}</p> : null}
        </div>
      </div>
    </>
  );
}
