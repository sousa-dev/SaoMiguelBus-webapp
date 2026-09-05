import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { Bus, ThumbsDown, ThumbsUp } from 'lucide-react';

import { Badge, Button, Card, CenteredSpinner, EmptyState } from '@/components/ui';
import { Seo } from '@/components/Seo';
import { BackLink, PageHeader } from '@/components/layout/Page';
import { DepartureRow } from '@/features/transit/components/DepartureRow';
import { JourneyMap } from '@/features/transit/components/JourneyMap';
import { journeyFromTripDetail } from '@/features/transit/lib/journey-fallback';
import {
  useStopDetail,
  useTripDetail,
  useTripGeometry,
  useTripVote,
} from '@/features/transit/hooks';
import { useBootstrap } from '@/hooks/useBootstrap';
import { FULL_DAY_START, displayRouteNumber, resolveDayType, splitStopLabel } from '@/lib/format';

export function TripDetailPage() {
  const { t } = useTranslation();
  const { tripId } = useParams();
  const id = tripId ? Number(tripId) : null;
  const trip = useTripDetail(id);
  const vote = useTripVote(id ?? 0);
  const { data: bootstrap } = useBootstrap();

  const journey = useMemo(
    () => (trip.data ? journeyFromTripDetail(trip.data) : null),
    [trip.data],
  );

  // No `from`/`to`, so this is the WHOLE trip — that is how the page draws the
  // full line rather than a board..alight slice. Only once real detail is in
  // hand: a cached fallback trip would 404 identically.
  const geometry = useTripGeometry({ tripId: id, enabled: Boolean(trip.data) });

  const day = useMemo(
    () => resolveDayType(new Date(), bootstrap?.holidays),
    [bootstrap?.holidays],
  );

  /**
   * "Other departures" on the same line.
   *
   * `start=00h00` on purpose: this is "the rest of the line's day", not "the next
   * departures", so a rider looking at an 08h20 trip still sees the 17h40 one.
   */
  const boardStopId = geometry.data?.stops[0]?.stopId ?? null;
  const stopDetail = useStopDetail({
    stopId: boardStopId,
    day,
    start: FULL_DAY_START,
    enabled: boardStopId != null,
  });

  const otherDepartures = useMemo(() => {
    if (!stopDetail.data || !trip.data) return [];
    return stopDetail.data.departures.filter(
      (departure) => departure.route === trip.data.route && departure.tripId !== trip.data.id,
    );
  }, [stopDetail.data, trip.data]);

  if (trip.isLoading) return <CenteredSpinner />;
  if (trip.isError || !trip.data || !journey) {
    return (
      <>
        <BackLink to="/transit" label={t('navBarSearchLabel')} />
        <EmptyState icon={Bus} title={t('routeNotFound', { defaultValue: 'Route not found' })} />
      </>
    );
  }

  const data = trip.data;
  const total = data.likes + data.dislikes;
  const likesPercent = data.likesPercent ?? (total ? Math.round((data.likes / total) * 100) : 0);

  return (
    <>
      <Seo title={`${t('routeLabel', { defaultValue: 'Route' })} ${displayRouteNumber(data.route)}`} />
      <BackLink to="/transit" label={t('navBarSearchLabel')} />
      <PageHeader
        title={`${t('routeLabel', { defaultValue: 'Route' })} ${displayRouteNumber(data.route)}`}
        subtitle={data.typeOfDay ?? undefined}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={ThumbsUp}
              onClick={() => vote.mutate('like')}
              disabled={vote.isPending}
            >
              {data.likes}
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={ThumbsDown}
              onClick={() => vote.mutate('dislike')}
              disabled={vote.isPending}
            >
              {data.dislikes}
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex items-center gap-2">
        <Badge tone={likesPercent >= 60 ? 'success' : 'warning'}>{likesPercent}% 👍</Badge>
        <Badge tone="neutral">
          {t('transitStopsCount', { count: data.stops.length })}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <JourneyMap journey={journey} wholeTrip className="h-80" />

          <Card className="p-5">
            <ol className="relative ml-1.5 border-l-2 border-border">
              {data.stops.map((stop, idx) => {
                const label = splitStopLabel(stop.name);
                return (
                  <li key={`${stop.name}-${idx}`} className="relative mb-4 pl-5 last:mb-0">
                    <span className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full border-2 border-surface bg-primary" />
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-medium text-content">{label.title}</span>
                      <span className="shrink-0 font-bold text-content">{stop.time}</span>
                    </div>
                    {label.subtitle ? <p className="text-xs text-muted">{label.subtitle}</p> : null}
                  </li>
                );
              })}
            </ol>
          </Card>
        </div>

        {otherDepartures.length > 0 ? (
          <Card className="overflow-hidden self-start">
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-sm font-bold text-content">{t('transitStopNextDepartures')}</h2>
              <p className="text-xs text-muted">{displayRouteNumber(data.route)}</p>
            </div>
            <div className="divide-y divide-border">
              {otherDepartures.map((departure) => (
                <DepartureRow
                  key={`${departure.tripId}-${departure.sequence}`}
                  departure={departure}
                />
              ))}
            </div>
          </Card>
        ) : null}
      </div>
    </>
  );
}
