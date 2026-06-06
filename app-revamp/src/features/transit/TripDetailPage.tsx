import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { Bus, ThumbsDown, ThumbsUp } from 'lucide-react';

import { Badge, Button, Card, CenteredSpinner, EmptyState } from '@/components/ui';
import { Seo } from '@/components/Seo';
import { BackLink, PageHeader } from '@/components/layout/Page';
import { displayRouteNumber, splitStopLabel } from '@/lib/format';
import { useTripDetail, useTripVote } from '@/features/transit/hooks';

export function TripDetailPage() {
  const { t } = useTranslation();
  const { tripId } = useParams();
  const id = tripId ? Number(tripId) : null;
  const trip = useTripDetail(id);
  const vote = useTripVote(id ?? 0);

  if (trip.isLoading) return <CenteredSpinner />;
  if (trip.isError || !trip.data) {
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
        subtitle={data.typeOfDay}
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
        <Badge tone="neutral">{data.stops.length} {t('stopsLabel', { defaultValue: 'stops' })}</Badge>
      </div>

      <Card className="max-w-2xl p-5">
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
    </>
  );
}
