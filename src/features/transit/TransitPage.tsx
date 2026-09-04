import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowRightLeft,
  Bus,
  BusFront,
  ChevronDown,
  Clock,
  Map as MapIcon,
  Route as RouteIcon,
  Search,
  Tag,
} from 'lucide-react';

import { Button, Card, EmptyState, SearchingState } from '@/components/ui';
import { Seo } from '@/components/Seo';
import { PageHeader } from '@/components/layout/Page';
import { useBootstrap } from '@/hooks/useBootstrap';
import { resolveDayType, splitStopLabel } from '@/lib/format';
import { cn } from '@/lib/cn';
import { useProfileStore } from '@/lib/store';
import { RouteWeatherGrid } from '@/features/transit/components';
import { AzoresbusLiveTeaser } from '@/features/transit/components/AzoresbusLiveTeaser';
import { JourneyCard } from '@/features/transit/components/JourneyCard';
import { ScheduleChangeBanner } from '@/features/transit/components/ScheduleChangeBanner';
import {
  ScheduleValidBadge,
  SchedulePreviewStrip,
} from '@/features/transit/components/SchedulePreviewNotice';
import {
  FavoritesPanel,
  RouteResultsToolbar,
} from '@/features/transit/components/RouteResultsToolbar';
import { StopPicker } from '@/features/transit/components/StopPicker';
import { useJourneySearch, useRouteWeather, useStops } from '@/features/transit/hooks';
import { useResolvedTransitDataset } from '@/features/transit/schedule-hooks';
import { AdBanner } from '@/features/ads/components/AdBanner';
import { InterstitialOrchestrator } from '@/features/ads/components/InterstitialOrchestrator';
import { useCanShowAds } from '@/features/premium/usePremium';
import type { TransitDataset } from '@/lib/types';

/** An untouched form means "the whole day", matching the legacy webapp. */
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
  const resolvedDataset = useResolvedTransitDataset();

  const recentSearches = useProfileStore((s) => s.recentSearches);
  const addRecentSearch = useProfileStore((s) => s.addRecentSearch);

  const [origin, setOrigin] = useState(params.get('origin') ?? '');
  const [destination, setDestination] = useState(params.get('destination') ?? '');
  const [dateStr, setDateStr] = useState(todayInputValue());
  const [time, setTime] = useState(DEFAULT_SEARCH_TIME);
  /**
   * ON by default and reset with the page. A rider who once wanted a single bus
   * must not silently keep getting fewer options days later.
   */
  const [allowTransfers, setAllowTransfers] = useState(true);
  const [searchEnabled, setSearchEnabled] = useState(
    Boolean(params.get('origin') && params.get('destination')),
  );
  const [showFavorites, setShowFavorites] = useState(false);
  const [recentsOpen, setRecentsOpen] = useState(false);
  const [interstitialTrigger, setInterstitialTrigger] = useState(0);
  const lastInterstitialSearchRef = useRef(0);
  const plannerRef = useRef<HTMLDivElement>(null);
  const canShowAds = useCanShowAds();

  const day = useMemo(
    () => resolveDayType(new Date(`${dateStr}T00:00:00`), bootstrap?.holidays),
    [dateStr, bootstrap?.holidays],
  );

  /**
   * Switching network empties the form.
   *
   * The `previous == null` guard is load-bearing: the dataset starts null and
   * resolves once bootstrap lands, and treating that first resolve as a change
   * would wipe an origin/destination that arrived by deep link — which is
   * exactly what the mobile app's share links target.
   */
  const previousDataset = useRef<TransitDataset | null>(null);
  useEffect(() => {
    const previous = previousDataset.current;
    previousDataset.current = resolvedDataset;
    if (previous == null || previous === resolvedDataset) return;
    setOrigin('');
    setDestination('');
    setSearchEnabled(false);
  }, [resolvedDataset]);

  const start = time.replace(':', 'h');

  const searchParams = useMemo(
    () => ({
      origin,
      destination,
      day,
      start,
      allowTransfers,
      enabled: searchEnabled && Boolean(origin && destination),
    }),
    [origin, destination, day, start, allowTransfers, searchEnabled],
  );

  const search = useJourneySearch(searchParams);
  const journeys = search.data?.journeys ?? [];
  const hasResults = journeys.length > 0;
  const earliestArrival = journeys[0]?.end;

  const routeWeather = useRouteWeather({
    origin,
    destination,
    dateStr,
    time,
    earliestArrival,
    enabled: searchParams.enabled && hasResults,
  });
  const showRouteWeather = Boolean(routeWeather.data?.origin && routeWeather.data.destination);

  useEffect(() => {
    if (hasResults && searchEnabled) {
      addRecentSearch({ origin, destination, day, time, dataset: resolvedDataset });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.data, searchEnabled, origin, destination, day, time, resolvedDataset]);

  useEffect(() => {
    if (!canShowAds || !searchEnabled || search.isFetching || !search.isFetched) {
      return;
    }
    if (lastInterstitialSearchRef.current === search.dataUpdatedAt) {
      return;
    }
    lastInterstitialSearchRef.current = search.dataUpdatedAt;
    setInterstitialTrigger((n) => n + 1);
  }, [canShowAds, search.dataUpdatedAt, search.isFetched, search.isFetching, searchEnabled]);

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
    setShowFavorites(false);
    setParams({ origin: o, destination: d }, { replace: true });
    // The visible effect of the tap happens up at the form, so go back to it.
    plannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const directionsHref = `/transit/directions?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&start=${start}`;

  const isEmpty = searchEnabled && !search.isFetching && search.data && journeys.length === 0;
  // The precedence matters: a search that found nothing because transfers were
  // off, or because of the time picked, is a different answer from "there is no
  // connection between these stops", and only one of the three is worth the
  // Google Directions escape hatch.
  const transfersAvailable = search.data?.transfersAvailable ?? 0;
  const canOfferTransfers = !allowTransfers && transfersAvailable > 0;
  const earlierAvailable = search.data?.earlierJourneysAvailable ?? 0;
  const canOfferWholeDay = earlierAvailable > 0;

  return (
    <>
      <Seo modulePath="/transit" />
      <PageHeader
        title={t('navBarSearchLabel')}
        subtitle={t('homeInstructionsTitle')}
        actions={
          resolvedDataset === 'azoresbus' ? (
            <div className="flex flex-wrap gap-2">
              {/* Only AzoresBus carries geometry and poles; on legacy these lead
                  nowhere, so they are not offered. */}
              <Link
                to="/transit/network"
                className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-semibold text-content hover:bg-surface-variant"
              >
                <MapIcon size={15} /> {t('transitNetworkMap')}
              </Link>
              <Link
                to="/transit/prices"
                className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-semibold text-content hover:bg-surface-variant"
              >
                <Tag size={15} /> {t('transitPricesTitle')}
              </Link>
            </div>
          ) : null
        }
      />

      <ScheduleChangeBanner />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
        {/* Planner column */}
        <div ref={plannerRef} className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          <Card className="p-5">
            <div className="flex flex-col gap-3">
              <StopPicker
                value={origin}
                onChange={setOrigin}
                stops={stops}
                placeholder={t('originPlaceholder', { defaultValue: 'Origin' })}
              />
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
              <StopPicker
                value={destination}
                onChange={setDestination}
                stops={stops}
                placeholder={t('destinationPlaceholder', { defaultValue: 'Destination' })}
              />

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
                  <span className="inline-flex items-center gap-1">
                    <Clock size={12} /> {t('timeLabel', { defaultValue: 'Time' })}
                  </span>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-content focus:border-primary focus:outline-none"
                  />
                </label>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={allowTransfers}
                onClick={() => setAllowTransfers((v) => !v)}
                className="flex items-center gap-3 rounded-xl border border-border px-3 py-2.5 text-left"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-content">
                    {t('transitAllowTransfers')}
                  </span>
                  <span className="block text-xs text-muted">
                    {allowTransfers
                      ? t('transitAllowTransfersOn')
                      : t('transitAllowTransfersOff')}
                  </span>
                </span>
                <span
                  aria-hidden
                  className={cn(
                    'relative h-6 w-11 shrink-0 rounded-full transition',
                    allowTransfers ? 'bg-primary' : 'bg-border',
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 h-5 w-5 rounded-full bg-surface shadow transition-all',
                      allowTransfers ? 'left-[22px]' : 'left-0.5',
                    )}
                  />
                </span>
              </button>

              <div className="flex gap-2">
                <Button
                  icon={Search}
                  className="flex-1"
                  onClick={runSearch}
                  disabled={!origin || !destination}
                >
                  {t('searchButton', { defaultValue: 'Search' })}
                </Button>
                <Button
                  variant="outline"
                  icon={RouteIcon}
                  onClick={() => navigate(directionsHref)}
                  disabled={!origin || !destination}
                >
                  {t('navBarRoutesLabel', { defaultValue: 'Directions' })}
                </Button>
              </div>
            </div>
          </Card>

          {resolvedDataset === 'azoresbus' ? <AzoresbusLiveTeaser /> : null}

          <Link to="/minibus">
            <Card className="flex items-center gap-3 p-4 hover:bg-surface-variant">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f47216]/12 text-[#f47216]">
                <BusFront size={18} strokeWidth={2} />
              </span>
              <span className="min-w-0 flex-1 text-sm font-semibold text-content">
                {t('minibusTransitLink')}
              </span>
              <ChevronDown size={16} className="-rotate-90 text-muted" />
            </Card>
          </Link>

          {recentSearches.length > 0 ? (
            <Card className="p-4">
              <button
                type="button"
                onClick={() => setRecentsOpen((v) => !v)}
                aria-expanded={recentsOpen}
                className="flex w-full items-center gap-2 text-left"
              >
                <h3 className="flex-1 text-sm font-bold text-content">
                  {t('recentSearchesTitle')}
                </h3>
                <span className="rounded-full bg-surface-variant px-1.5 text-xs font-bold text-muted">
                  {recentSearches.length}
                </span>
                <ChevronDown
                  size={16}
                  className={cn('text-muted transition', recentsOpen && 'rotate-180')}
                />
              </button>
              {recentsOpen ? (
                <div className="mt-2 flex flex-col gap-1.5">
                  {recentSearches.map((r, i) => (
                    <button
                      key={`${r.origin}-${r.destination}-${i}`}
                      onClick={() => apply(r.origin, r.destination)}
                      className="truncate rounded-lg px-2 py-1.5 text-left text-sm text-content hover:bg-surface-variant"
                    >
                      {splitStopLabel(r.origin).title} → {splitStopLabel(r.destination).title}
                    </button>
                  ))}
                </div>
              ) : null}
            </Card>
          ) : null}
        </div>

        {/* Results column */}
        <div className="flex flex-col gap-4">
          <RouteResultsToolbar
            origin={origin}
            destination={destination}
            expanded={showFavorites}
            onToggleExpanded={() => setShowFavorites((v) => !v)}
          />
          {showFavorites ? <FavoritesPanel onSelect={apply} /> : null}

          {showRouteWeather && routeWeather.data?.origin && routeWeather.data.destination ? (
            <RouteWeatherGrid
              origin={routeWeather.data.origin}
              destination={routeWeather.data.destination}
            />
          ) : null}
          {canShowAds ? <AdBanner on="home" slot="top" /> : null}

          {!searchEnabled && !hasResults ? (
            <Card className="p-6">
              <h3 className="mb-1 text-lg font-bold text-content">{t('homeInstructionsTitle')}</h3>
              <p className="text-sm text-muted">{t('homeInstructionsText')}</p>
              <p className="mt-2 text-sm text-muted">{t('homeInstructionsText2')}</p>
            </Card>
          ) : null}

          {search.isFetching ? <SearchingState variant="journeys" /> : null}

          {isEmpty && canOfferTransfers ? (
            <EmptyState
              icon={Bus}
              title={t('noDirectRoutesMessage', { origin, destination })}
              description={t('noDirectRoutesSubtitle', { count: transfersAvailable })}
              actionLabel={t('enableTransfersButton')}
              onAction={() => setAllowTransfers(true)}
            />
          ) : null}

          {isEmpty && !canOfferTransfers && canOfferWholeDay ? (
            <EmptyState
              icon={Clock}
              title={t('noRoutesAfterTimeMessage', { time })}
              description={t('noRoutesSubtitle')}
              actionLabel={t('noRoutesAfterTimeAction')}
              onAction={() => setTime(DEFAULT_SEARCH_TIME)}
            />
          ) : null}

          {isEmpty && !canOfferTransfers && !canOfferWholeDay ? (
            <EmptyState
              icon={Bus}
              title={t('noRoutesMessage', { origin, destination })}
              description={t('noRoutesSubtitle')}
              actionLabel={t('tryDirectionsButton')}
              onAction={() => navigate(directionsHref)}
            />
          ) : null}

          {hasResults && !search.isFetching ? (
            <>
              {/* Rides with the RESULTS, not the page: a rider who scrolled past
                  the banner, or shares a screenshot, must still see that these
                  times are not in force yet. */}
              <SchedulePreviewStrip />
              <ScheduleValidBadge />
              {journeys.flatMap((journey, index) => {
                const cards = [<JourneyCard key={journey.id} journey={journey} />];
                if (canShowAds && index % 2 === 1) {
                  cards.push(<AdBanner key={`ad-inline-${index}`} on="home" slot={`inline-${index}`} />);
                }
                return cards;
              })}
            </>
          ) : null}

          {stopsLoading && !searchEnabled ? (
            <p className="text-sm text-muted">{t('loading', { defaultValue: 'Loading…' })}</p>
          ) : null}
        </div>
      </div>

      {canShowAds ? (
        <InterstitialOrchestrator
          trigger={interstitialTrigger}
          ready={searchEnabled && !search.isFetching && search.isFetched}
        />
      ) : null}
    </>
  );
}
