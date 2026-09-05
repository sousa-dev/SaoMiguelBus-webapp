import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Bus,
  ChevronDown,
  Clock,
  Footprints,
  ThumbsDown,
  ThumbsUp,
  TriangleAlert,
} from 'lucide-react';

import { Card } from '@/components/ui';
import { JourneyMap } from '@/features/transit/components/JourneyMap';
import { PinTrackTeaser } from '@/features/transit/components/PinTrackTeaser';
import { SchedulePreviewChip } from '@/features/transit/components/SchedulePreviewNotice';
import { journeyRouteLabel } from '@/features/transit/lib/journey-fallback';
import { cn } from '@/lib/cn';
import {
  displayRouteNumber,
  formatDurationWords,
  needsRouteConfirmation,
  splitStopLabel,
} from '@/lib/format';
import { isRideLeg, journeyRideLegs } from '@/lib/types';
import type { TransitJourney, TransitRideLeg, TransitTransferLeg } from '@/lib/types';

/** `+1` when a leg's arrival wraps past midnight. */
function DayOffsetBadge({ offset }: { offset: number }) {
  if (!offset) return null;
  return (
    <span className="ml-1 rounded bg-surface-variant px-1 text-[10px] font-bold text-muted">
      +{offset}
    </span>
  );
}

function StopRow({
  name,
  time,
  dayOffset = 0,
  emphasis = false,
}: {
  name: string;
  time: string;
  dayOffset?: number;
  emphasis?: boolean;
}) {
  const label = splitStopLabel(name);
  return (
    <li className="relative mb-3 pl-4 last:mb-0">
      <span
        className={cn(
          'absolute -left-[7px] top-1.5 h-3 w-3 rounded-full border-2 border-surface',
          emphasis ? 'bg-primary' : 'bg-border',
        )}
      />
      <div className="flex items-baseline justify-between gap-2">
        <span
          className={cn('text-sm text-content', emphasis ? 'font-bold' : 'font-medium')}
          title={name}
        >
          {label.title}
        </span>
        <span className="shrink-0 text-sm font-semibold text-muted">
          {time}
          <DayOffsetBadge offset={dayOffset} />
        </span>
      </div>
      {label.subtitle ? <p className="text-xs text-muted">{label.subtitle}</p> : null}
    </li>
  );
}

/**
 * The change itself, as its own step.
 *
 * Everything the rider needs to judge whether they will make it, and the warning
 * quotes SLACK rather than the raw wait: a 12-minute wait with a 9-minute walk
 * leaves 3, and it is the 3 that decides whether to risk it.
 */
export function TransferRow({ leg }: { leg: TransitTransferLeg }) {
  const { t } = useTranslation();
  const walks = leg.walkMinutes > 0;

  return (
    <li className="relative mb-3 pl-4 last:mb-0">
      <span className="absolute -left-[9px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-surface bg-accent">
        <Bus size={9} className="text-on-primary" />
      </span>
      <div
        className={cn(
          'rounded-xl border px-3 py-2',
          leg.tight ? 'border-warning bg-warning-surface' : 'border-border bg-surface-variant',
        )}
      >
        {/* Full stop names here, never `splitStopLabel`. Both ends of a change
            are usually in the same village, so the landmark IS the information —
            "walk from FURNAS to FURNAS" tells a rider nothing. */}
        <p className="text-sm font-semibold text-content">
          {t('transitTransferAt', { stop: leg.at })}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <Clock size={12} />
            {t('transitWaitDuration', { duration: formatDurationWords(t, leg.waitMinutes) })}
          </span>
          {walks ? (
            <span className="inline-flex items-center gap-1">
              <Footprints size={12} />
              {t('transitWalkFromTo', { count: leg.walkMinutes, from: leg.from })}
            </span>
          ) : null}
          <span className="font-semibold text-content">
            {displayRouteNumber(leg.fromRoute)} → {displayRouteNumber(leg.toRoute)}
          </span>
        </p>
        {leg.tight ? (
          <p className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-warning">
            <TriangleAlert size={13} className="mt-0.5 shrink-0" />
            <span>
              <strong>
                {/* The number that says how rushed the change is — slack, never
                    the raw wait. */}
                {t('transitTightTransferTitle', { count: leg.slackMinutes })}
              </strong>{' '}
              {walks
                ? t('transitTightTransferWalk', { stop: leg.at })
                : t('transitTightTransferBody')}
            </span>
          </p>
        ) : null}
      </div>
    </li>
  );
}

function RideLegPanel({ leg, linkToDetail }: { leg: TransitRideLeg; linkToDetail: boolean }) {
  const { t } = useTranslation();
  const lowConfidence = needsRouteConfirmation(leg.likesPercent);

  return (
    <li className="mb-3 last:mb-0">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-7 min-w-7 items-center justify-center rounded-lg bg-primary px-1.5 text-sm font-bold text-on-primary">
          {displayRouteNumber(leg.route)}
        </span>
        <span className="text-xs text-muted">
          {t('transitStopsCount', { count: leg.stops.length })}
        </span>
        {lowConfidence ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-warning">
            <TriangleAlert size={12} />
            {t('confirmationRequired')}
          </span>
        ) : null}
      </div>
      <ol className="relative ml-1.5 border-l-2 border-border">
        {leg.stops.map((stop, index) => (
          <StopRow
            key={`${stop.name}-${stop.sequence ?? index}`}
            name={stop.name}
            time={stop.time}
            dayOffset={
              index === 0
                ? leg.board.dayOffset
                : index === leg.stops.length - 1
                  ? leg.alight.dayOffset
                  : 0
            }
            emphasis={index === 0 || index === leg.stops.length - 1}
          />
        ))}
      </ol>
      {linkToDetail ? (
        <Link
          to={`/transit/trip/${leg.tripId}`}
          className="mt-1 inline-block text-sm font-semibold text-primary hover:underline"
        >
          {t('clickToSeeDetails')} →
        </Link>
      ) : null}
    </li>
  );
}

function JourneyTimeline({ journey }: { journey: TransitJourney }) {
  const { t } = useTranslation();
  const rides = journeyRideLegs(journey);
  const origin = splitStopLabel(rides[0]?.board.name ?? '');
  const destination = splitStopLabel(rides[rides.length - 1]?.alight.name ?? '');

  return (
    <div className="flex items-center gap-3">
      <div className="w-20 shrink-0 text-left">
        <p className="text-lg font-bold text-content">{journey.start}</p>
        <p className="truncate text-xs text-muted" title={rides[0]?.board.name}>
          {origin.title}
        </p>
      </div>
      <div className="flex flex-1 flex-col items-center">
        <span className="mb-1 text-xs font-semibold text-muted">
          {formatDurationWords(t, journey.durationMinutes)}
        </span>
        <div className="flex w-full items-center">
          <span className="h-2.5 w-2.5 rounded-full bg-primary" />
          <span className="h-0.5 flex-1 bg-border" />
          <Bus size={14} className="mx-1 text-muted" />
          <span className="h-0.5 flex-1 bg-border" />
          <span className="h-2.5 w-2.5 rounded-full bg-primary" />
        </div>
      </div>
      <div className="w-20 shrink-0 text-right">
        <p className="text-lg font-bold text-content">
          {journey.end}
          <DayOffsetBadge offset={journey.dayOffset} />
        </p>
        <p className="truncate text-xs text-muted" title={rides[rides.length - 1]?.alight.name}>
          {destination.title}
        </p>
      </div>
    </div>
  );
}

/**
 * One whole itinerary: a single bus, or two with a change between them.
 *
 * Everything above the toggle is itself clickable — the legacy card was, and a
 * card that looks pressable but is not reads as broken — while the explicit
 * toggle row stays as the affordance that TELLS you it expands.
 */
export function JourneyCard({ journey }: { journey: TransitJourney }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const rides = journeyRideLegs(journey);
  const anyTight = journey.legs.some((leg) => !isRideLeg(leg) && leg.tight);
  const lowConfidence = rides.some((leg) => needsRouteConfirmation(leg.likesPercent));
  const worstLikes = Math.min(...rides.map((leg) => leg.likesPercent), 100);
  const worstDislikes = Math.max(...rides.map((leg) => leg.dislikesPercent), 0);

  return (
    <Card className="overflow-hidden">
      <div
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onClick={() => setExpanded((e) => !e)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setExpanded((v) => !v);
          }
        }}
        className="cursor-pointer text-left"
      >
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="flex h-9 items-center justify-center rounded-lg bg-primary px-2 font-bold text-on-primary">
              {journeyRouteLabel(journey, displayRouteNumber)}
            </span>
            <span className="text-xs text-muted">
              {journey.transfers > 0
                ? t('transitTransfersCount', { count: journey.transfers })
                : t('transitDirectJourney')}
            </span>
            {anyTight ? (
              <span className="inline-flex items-center gap-1 rounded-lg border border-warning px-1.5 py-0.5 text-xs font-semibold text-warning">
                <TriangleAlert size={12} />
                {t('transitTightTransferTitle', {
                  count: Math.min(
                    ...journey.legs
                      .filter((leg): leg is TransitTransferLeg => !isRideLeg(leg) && leg.tight)
                      .map((leg) => leg.slackMinutes),
                  ),
                })}
              </span>
            ) : null}
            <SchedulePreviewChip />
          </div>
          <div className="flex shrink-0 items-center gap-3 text-xs font-semibold">
            <span className="inline-flex items-center gap-1 text-success">
              <ThumbsUp size={13} /> {Math.round(worstLikes)}%
            </span>
            <span className="inline-flex items-center gap-1 text-danger">
              <ThumbsDown size={13} /> {Math.round(worstDislikes)}%
            </span>
          </div>
        </div>

        {lowConfidence ? (
          <div className="flex items-start gap-2 bg-warning-surface px-4 py-2 text-xs font-medium text-warning">
            <TriangleAlert size={14} className="mt-0.5 shrink-0" />
            <span>
              <strong>{t('confirmationRequired')}</strong> — {t('confirmationMessage')}
            </span>
          </div>
        ) : null}

        <div className="px-4 py-4">
          <JourneyTimeline journey={journey} />
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-border px-2">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-sm font-semibold text-primary hover:bg-surface-variant"
        >
          {expanded ? t('transitHideSteps') : t('transitShowSteps')}
          <ChevronDown size={16} className={cn('transition', expanded && 'rotate-180')} />
        </button>
        <PinTrackTeaser journey={journey} />
      </div>

      {expanded ? (
        <div className="border-t border-border px-4 py-3">
          <ol className="relative ml-1.5 border-l-2 border-border pl-0">
            {journey.legs.map((leg, index) =>
              isRideLeg(leg) ? (
                <RideLegPanel key={`ride-${leg.tripId}-${index}`} leg={leg} linkToDetail />
              ) : (
                <TransferRow key={`transfer-${leg.at}-${index}`} leg={leg} />
              ),
            )}
          </ol>
          {/* Mounted only here: mounting is what FETCHES the geometry, so a page
              of twenty results does not fire forty requests for maps nobody
              opened. */}
          <JourneyMap journey={journey} className="mt-3" />
        </div>
      ) : null}
    </Card>
  );
}
