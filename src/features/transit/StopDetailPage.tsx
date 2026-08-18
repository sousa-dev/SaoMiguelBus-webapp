import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { Bus, MapPin, Star } from 'lucide-react';

import { Card, CenteredSpinner, EmptyState } from '@/components/ui';
import { MapView } from '@/components/MapView';
import { Seo } from '@/components/Seo';
import { BackLink, PageHeader } from '@/components/layout/Page';
import { DepartureRow } from '@/features/transit/components/DepartureRow';
import { useStopDetail } from '@/features/transit/hooks';
import { useBootstrap } from '@/hooks/useBootstrap';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/cn';
import { departuresStartTime, displayRouteNumber, resolveDayType, splitStopLabel } from '@/lib/format';
import { useProfileStore } from '@/lib/store';

/** The departures window is re-read on this cadence, not on every render. */
const CLOCK_TICK_MS = 60_000;

export function StopDetailPage() {
  const { t } = useTranslation();
  const { stopId } = useParams();
  const id = stopId ? Number(stopId) : null;
  const { data: bootstrap } = useBootstrap();

  // `now` is state and ticks, rather than being read at render time, so the
  // query key changes on a schedule instead of on every re-render.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), CLOCK_TICK_MS);
    return () => clearInterval(timer);
  }, []);

  const day = useMemo(() => resolveDayType(now, bootstrap?.holidays), [now, bootstrap?.holidays]);
  // Bucketed DOWN to five minutes: it keeps the query key stable, and it leaves
  // grace at the front so a bus that pulled out two minutes ago is still visible
  // to someone running for it.
  const start = useMemo(() => departuresStartTime(now), [now]);

  const stop = useStopDetail({ stopId: id, day, start });

  const favoriteStops = useProfileStore((s) => s.favoriteStops);
  const toggleFavoriteStop = useProfileStore((s) => s.toggleFavoriteStop);
  const isFavorite = favoriteStops.some((s) => s.name === stop.data?.name);

  useEffect(() => {
    if (stop.data) {
      track('transit', 'stop_view', { stop_id: stop.data.id, dataset: stop.data.dataset });
    }
  }, [stop.data]);

  if (stop.isLoading && !stop.data) return <CenteredSpinner />;
  if (stop.isError || !stop.data) {
    return (
      <>
        <BackLink to="/transit" label={t('navBarSearchLabel')} />
        <EmptyState icon={MapPin} title={t('transitStopNotFound')} />
      </>
    );
  }

  const data = stop.data;
  const label = splitStopLabel(data.name);
  // Poles when we have them (AzoresBus), the collapsed centroid otherwise.
  const points =
    data.poles.length > 0
      ? data.poles.map((pole) => ({
          id: pole.code,
          lat: pole.lat,
          lng: pole.lon,
          popup: (
            <span className="text-xs">
              <strong>{pole.code}</strong> · {pole.name}
            </span>
          ),
        }))
      : [{ id: data.id, lat: data.lat, lng: data.lon }];

  return (
    <>
      <Seo title={data.name} />
      <BackLink to="/transit" label={t('navBarSearchLabel')} />
      <PageHeader
        title={label.title}
        subtitle={label.subtitle ?? undefined}
        actions={
          <button
            type="button"
            aria-pressed={isFavorite}
            onClick={() => toggleFavoriteStop({ id: data.id, name: data.name })}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-semibold text-content hover:bg-surface-variant"
          >
            <Star size={15} className={cn(isFavorite ? 'fill-accent text-accent' : 'text-muted')} />
            {isFavorite ? t('removeFavorites') : t('addFavorites')}
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div
            className="h-64 overflow-hidden rounded-2xl border border-border"
            aria-label={t('transitStopMapA11y', { stop: data.name })}
          >
            <MapView points={points} />
          </div>

          {data.poles.length > 0 ? (
            <Card className="p-4">
              <h2 className="mb-1 text-sm font-bold text-content">{t('transitStopPoles')}</h2>
              {/* Which side of the road matters, and one name can cover both. */}
              {data.poles.length > 1 ? (
                <p className="mb-2 text-xs text-muted">{t('transitStopPolesHint')}</p>
              ) : null}
              <div className="flex flex-wrap gap-1.5">
                {data.poles.map((pole) => (
                  <span
                    key={pole.code}
                    className="rounded-lg border border-border px-2 py-1 text-xs font-semibold text-content"
                  >
                    {pole.code}
                  </span>
                ))}
              </div>
            </Card>
          ) : null}

          {data.lines.length > 0 ? (
            <Card className="p-4">
              <h2 className="mb-2 text-sm font-bold text-content">{t('transitStopLines')}</h2>
              <div className="flex flex-wrap gap-1.5">
                {data.lines.map((line) => (
                  <Link
                    key={line}
                    to={`/transit/line/${encodeURIComponent(line)}`}
                    className="rounded-lg bg-primary px-2 py-1 text-xs font-bold text-on-primary hover:opacity-90"
                  >
                    {displayRouteNumber(line)}
                  </Link>
                ))}
              </div>
            </Card>
          ) : null}
        </div>

        <Card className="overflow-hidden">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-bold text-content">{t('transitStopNextDepartures')}</h2>
            {/* Without this caption an empty list at 23:00 is indistinguishable
                from a stop with no service at all. */}
            <p className="text-xs text-muted">
              {t('transitStopDeparturesFrom', { time: start.replace('h', ':') })}
            </p>
          </div>
          {data.departures.length === 0 ? (
            <div className="px-4 py-8">
              <EmptyState icon={Bus} title={t('transitStopNoMoreDeparturesToday')} />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {data.departures.map((departure) => (
                <DepartureRow
                  key={`${departure.tripId}-${departure.sequence}`}
                  departure={departure}
                />
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
