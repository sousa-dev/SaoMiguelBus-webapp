// Ported from SaoMiguelBus/features/transit/components/ActiveTrackingSection.tsx (no alarms).
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { LocateFixed, X } from 'lucide-react';

import { usePremium } from '@/features/premium/usePremium';
import { TrackingSection } from '@/features/transit/tracking/components/TrackingSection';
import { useBusTracking } from '@/features/transit/tracking/hooks/useBusTracking';
import { useTrackLive } from '@/features/transit/tracking/hooks/useTrackLive';
import { journeyPositionLabels, type JourneyTrackStatus } from '@/features/transit/tracking/bus-tracking';
import {
  applyLiveToJourney,
  journeyLiveFootnote,
  uniqueLiveTripIds,
} from '@/features/transit/tracking/live-track';
import { cn } from '@/lib/cn';

export function ActiveTrackingSection() {
  const { t } = useTranslation();
  const isPremium = usePremium();
  const { active, stopTracking } = useBusTracking();

  const now = new Date();
  const tripIds = useMemo(
    () => uniqueLiveTripIds(active, now),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `active` already re-derives on the 30s tick
    [active],
  );
  const { trips } = useTrackLive(tripIds);

  // Webapp parity: the active-tracking widget is premium-only.
  if (!isPremium || active.length === 0) return null;

  return (
    <TrackingSection
      testId="active-tracking"
      icon={<LocateFixed size={16} />}
      tone="primary"
      title={t('transitActiveTracking')}
      subtitle={t('activeTrackingSubtitle')}
      count={
        active.length === 1 ? t('trackingCountSingular') : t('trackingCountPlural', { count: active.length })
      }
    >
      {active.map(({ track, journey }) => {
        const merged = applyLiveToJourney(journey, track, trips, now);
        // The relevant leg: whichever bus the rider is waiting for or riding right now.
        const openTripId = track.legs[merged.legIndex]?.tripId;
        const body = (
          <>
            <div className="flex items-center justify-between gap-2">
              <span className="text-base font-extrabold text-primary">{track.routeNumber}</span>
              <button
                type="button"
                aria-label={t('transitStopTrack')}
                title={t('transitStopTrack')}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  stopTracking(track.id);
                }}
                className="rounded-lg p-1 text-muted hover:bg-surface hover:text-content"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-sm text-content">
              {track.origin} → {track.destination}
            </p>
            {track.auto ? <p className="mt-1 text-xs text-info">{t('trackStartedFromPin')}</p> : null}
            <p className="mt-1 text-xs text-muted">
              {t(merged.statusLabel.key, merged.statusLabel.params)} ·{' '}
              {t(merged.countdown.key, merged.countdown.params)}
            </p>
            <TrackPosition journey={merged} />
            <LegStrip journey={merged} />
          </>
        );
        const className = 'block rounded-xl border border-border bg-surface-variant p-3';
        return openTripId ? (
          <Link key={track.id} to={`/transit/trip/${openTripId}`} className={className}>
            {body}
          </Link>
        ) : (
          <div key={track.id} className={className}>
            {body}
          </div>
        );
      })}
    </TrackingSection>
  );
}

/**
 * Where the bus actually is. The footnote stays the schedule disclaimer until a live bus could
 * be attributed to this leg, at which point `journeyLiveFootnote` reports the real delay.
 */
function TrackPosition({ journey }: { journey: JourneyTrackStatus }) {
  const { t } = useTranslation();
  const { primary, secondary } = journeyPositionLabels(journey);
  const footnote = journeyLiveFootnote(journey, new Date());
  const isLive = footnote.key !== 'trackPositionEstimated';

  return (
    <div className="mt-2 flex flex-col gap-0.5">
      <p className="text-sm text-content">{t(primary.key, primary.params)}</p>
      {secondary ? <p className="text-xs text-muted">{t(secondary.key, secondary.params)}</p> : null}
      <p className={cn('text-xs', isLive ? 'text-success' : 'text-muted/80')}>
        {t(footnote.key, footnote.params)}
      </p>
    </div>
  );
}

/** One row per bus with the change spelled out between them. */
function LegStrip({ journey }: { journey: JourneyTrackStatus }) {
  const { t } = useTranslation();
  if (journey.legs.length === 0) return null;

  return (
    <div className="mt-2 flex flex-col gap-1">
      {journey.legs.map((leg, index) => {
        // `transfers[i]` is the change made BEFORE leg i + 1, so leg i reads the one at i - 1.
        const transfer = index > 0 ? (journey.transfers[index - 1] ?? null) : null;
        const isCurrent = leg.state === 'riding';
        const fill = leg.state === 'done' ? 'bg-success' : isCurrent ? 'bg-primary' : 'bg-border';
        return (
          <div key={`${leg.routeNumber}-${index}`}>
            {transfer ? (
              <p className={cn('mb-1 text-xs', transfer.tight ? 'text-warning' : 'text-muted')}>
                {t(transfer.tight ? 'trackStatusTransferTightWait' : 'trackStatusTransferWait', {
                  minutes: transfer.waitMinutes,
                  at: transfer.at,
                })}
              </p>
            ) : null}
            <div className="flex items-center gap-2">
              <span className={cn('min-w-9 text-xs', isCurrent ? 'font-bold text-primary' : 'text-muted')}>
                {leg.routeNumber}
              </span>
              <span className="h-1 flex-1 overflow-hidden rounded-full bg-border">
                <span className={cn('block h-full', fill)} style={{ width: `${leg.progress}%` }} />
              </span>
              <span className="max-w-[45%] truncate text-right text-xs text-muted">
                {leg.destination} {leg.arrival}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
