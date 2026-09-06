// Ported from SaoMiguelBus/features/transit/components/PinnedRoutesSection.tsx.
import { useTranslation } from 'react-i18next';
import { Pin, X } from 'lucide-react';

import { usePremiumGate } from '@/features/premium/hooks/usePremiumGate';
import { usePremium } from '@/features/premium/usePremium';
import { useFollowPinnedRoute } from '@/features/transit/pinned/hooks/useFollowPinnedRoute';
import { useScheduleConfig } from '@/features/transit/schedule-hooks';
import { TrackingSection } from '@/features/transit/tracking/components/TrackingSection';
import { useBusTracking } from '@/features/transit/tracking/hooks/useBusTracking';
import { pinShape, type Translate } from '@/features/transit/pinned/pin-shape';
import { cn } from '@/lib/cn';

type Props = {
  onSelect: (origin: string, destination: string) => void;
};

export function PinnedRoutesSection({ onSelect }: Props) {
  const { t } = useTranslation();
  const isPremium = usePremium();
  const { canTrackTrips } = useScheduleConfig();
  const { guardPremiumAction } = usePremiumGate();
  const { pinned, unpinRoute } = useBusTracking();
  const { followPin, followingId } = useFollowPinnedRoute();

  // Webapp parity: pinned routes are a premium-only widget.
  if (!isPremium || pinned.length === 0) return null;

  return (
    <TrackingSection
      testId="pinned-routes"
      icon={<Pin size={16} />}
      tone="info"
      title={t('transitPinnedRoutes')}
      subtitle={t('pinnedRoutesSubtitle')}
      count={String(pinned.length)}
      defaultOpen={false}
    >
      {pinned.map((pin) => (
        <div
          key={pin.id}
          className={cn(
            'rounded-xl border border-border bg-surface-variant p-3',
            // Never removed, only greyed — a pin vanishing on cutover day reads as data loss.
            pin.unavailable && 'opacity-55',
          )}
        >
          <div className="flex items-start gap-2">
            <button
              type="button"
              onClick={() => onSelect(pin.origin, pin.destination)}
              className="min-w-0 flex-1 text-left"
            >
              <span className="block text-base font-extrabold text-content">{pin.routeNumber}</span>
              <span className="block text-sm text-muted">
                {pin.origin} → {pin.destination}
              </span>
              <span className="mt-1 block text-xs text-muted">{pinShape(pin, t as Translate)}</span>
            </button>
            <button
              type="button"
              aria-label={t('transitUnpinRoute')}
              title={t('transitUnpinRoute')}
              onClick={() => unpinRoute(pin.id)}
              className="rounded-lg p-1 text-muted hover:bg-surface hover:text-content"
            >
              <X size={16} />
            </button>
          </div>

          {pin.unavailable ? (
            <p className="mt-2 text-xs text-warning">{t('transitPinnedUnavailable')}</p>
          ) : null}

          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onSelect(pin.origin, pin.destination)}
              className="rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-content hover:bg-surface"
            >
              {t('transitPinnedViewTimes')}
            </button>
            {/* A pin can be STORED while previewing, but a countdown must not run against a
                timetable that is not in force. */}
            {canTrackTrips && !pin.unavailable ? (
              <button
                type="button"
                disabled={followingId !== null}
                onClick={() => guardPremiumAction(() => void followPin(pin), 'track_start')}
                className="rounded-lg border border-primary px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/10 disabled:opacity-60"
              >
                {followingId === pin.id ? t('transitPinnedFollowSearching') : t('transitPinnedFollow')}
              </button>
            ) : null}
          </div>
        </div>
      ))}
    </TrackingSection>
  );
}
