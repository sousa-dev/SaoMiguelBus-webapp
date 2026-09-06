/**
 * Pin and track a WHOLE itinerary from the journey card's action row. Ported from the Expo
 * `JourneyTrackButton` minus the notification bell (alarms are mobile-only).
 */
import { useTranslation } from 'react-i18next';
import { MapPin, Pin } from 'lucide-react';

import { usePremiumGate } from '@/features/premium/hooks/usePremiumGate';
import { canPin } from '@/features/transit/lib/schedule-config';
import { useScheduleConfig } from '@/features/transit/schedule-hooks';
import { useBusTracking } from '@/features/transit/tracking/hooks/useBusTracking';
import { cn } from '@/lib/cn';
import { showNotice } from '@/lib/notice-store';
import type { TransitJourney } from '@/lib/types';

type Props = {
  journey: TransitJourney;
  searchDay: string;
  showPin?: boolean;
};

const iconButton =
  'inline-flex h-9 w-9 items-center justify-center rounded-full border transition hover:bg-surface-variant';

export function JourneyTrackButton({ journey, searchDay, showPin = true }: Props) {
  const { t } = useTranslation();
  // Tracking stands down against a timetable that is not in force; pinning does not.
  const { canTrackTrips } = useScheduleConfig();
  const {
    canStartMore,
    startFromJourney,
    stopTracking,
    pinFromJourney,
    unpinRoute,
    isTrackingJourney,
    isPinnedJourney,
    activeJourneyId,
    pinned,
  } = useBusTracking();
  const { guardPremiumAction } = usePremiumGate();

  const tracking = isTrackingJourney(journey.id);
  const isPinned = isPinnedJourney(journey.id);
  const trackId = activeJourneyId(journey.id);

  const capNotice = () =>
    showNotice({ title: t('transitTrackCapTitle'), message: t('transitTrackCapMessage') });

  const onTrack = () => {
    // Stopping an active track is always allowed; starting is premium-gated.
    if (tracking && trackId) {
      stopTracking(trackId);
      return;
    }
    guardPremiumAction(() => {
      if (!canStartMore || !startFromJourney(journey, searchDay)) capNotice();
    }, 'track_start');
  };

  const onPin = () => {
    if (isPinned) {
      const existing = pinned.find((p) => p.journeyId === journey.id);
      if (existing) unpinRoute(existing.id);
      return;
    }
    guardPremiumAction(() => {
      if (pinFromJourney(journey, searchDay) === 'cap') {
        showNotice({ title: t('transitPinCapTitle'), message: t('transitPinCapMessage') });
      }
    }, 'track_pin');
  };

  const showTrack = canTrackTrips;
  const showPinAction = showPin && canPin();
  if (!showTrack && !showPinAction) return null;

  return (
    <div className="flex items-center gap-2 px-2">
      {showTrack ? (
        <button
          type="button"
          onClick={onTrack}
          aria-pressed={tracking}
          aria-label={tracking ? t('transitStopTrack') : t('transitStartTrack')}
          title={tracking ? t('transitStopTrack') : t('transitStartTrack')}
          className={cn(
            iconButton,
            tracking ? 'border-primary bg-primary text-on-primary hover:bg-primary/90' : 'border-border text-muted',
          )}
        >
          <MapPin size={16} strokeWidth={2.5} />
        </button>
      ) : null}
      {showPinAction ? (
        <button
          type="button"
          onClick={onPin}
          aria-pressed={isPinned}
          aria-label={isPinned ? t('transitUnpinRoute') : t('transitPinRoute')}
          title={isPinned ? t('transitUnpinRoute') : t('transitPinRoute')}
          className={cn(
            iconButton,
            isPinned ? 'border-accent bg-accent text-on-accent hover:bg-accent/90' : 'border-border text-muted',
          )}
        >
          <Pin size={16} strokeWidth={2.5} />
        </button>
      ) : null}
    </div>
  );
}
