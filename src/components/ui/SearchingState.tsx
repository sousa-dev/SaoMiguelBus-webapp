import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bus } from 'lucide-react';

import { Card } from '@/components/ui';
import { formatAppDate } from '@/lib/format';
import { cn } from '@/lib/cn';

/** How long each reassurance message stays on screen. */
const MESSAGE_INTERVAL_MS = 1600;

const JOURNEY_MESSAGES = [
  ['searchingBuses', 'Searching buses…'],
  ['searchingTimetables', "Checking today's timetables…"],
  ['searchingConnections', 'Looking for connections…'],
  ['searchingSorting', 'Sorting by departure time…'],
] as const;

const DIRECTIONS_MESSAGES = [
  ['searchingDirections', 'Plotting your route…'],
  ['searchingWalking', 'Measuring the walking legs…'],
  ['searchingDeparture', 'Matching the next departures…'],
  ['searchingSteps', 'Putting the steps in order…'],
] as const;

function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Two local calendar dates compared at day granularity — the planner's `date` is
 * a local Date set by the date picker, never an instant in another timezone.
 */
function isNextLocalDay(target: Date, ref: Date): boolean {
  const tomorrow = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() + 1);
  return isSameLocalDay(target, tomorrow);
}

/**
 * The "today" copy is wrong whenever a rider searched for tomorrow or a later
 * date. Fall back to a {{date}}-interpolated message for any day that is not
 * today or tomorrow — keeps the rotating reassurance accurate.
 */
function timetablesMessage(date?: Date): {
  key: string;
  defaultValue: string;
  params?: Record<string, string>;
} {
  if (!date) {
    return { key: 'searchingTimetables', defaultValue: "Checking today's timetables…" };
  }
  const now = new Date();
  if (isSameLocalDay(date, now)) {
    return { key: 'searchingTimetables', defaultValue: "Checking today's timetables…" };
  }
  if (isNextLocalDay(date, now)) {
    return { key: 'searchingTimetablesTomorrow', defaultValue: "Checking tomorrow's timetables…" };
  }
  return {
    key: 'searchingTimetablesDate',
    defaultValue: 'Checking timetables for {{date}}…',
    params: { date: formatAppDate(date) },
  };
}

/** Gradient sweep that reads as "working", unlike the flat idle pulse. */
function Shimmer({ className }: { className?: string }) {
  return (
    <div className={cn('smb-shimmer rounded-lg bg-surface-variant', className)} />
  );
}

/**
 * The bus actually travels the line between the two stops, so the wait looks
 * like the thing being waited for rather than a generic spinner.
 */
function BusTrack() {
  return (
    <div className="flex items-center gap-2 px-2">
      <span className="smb-stop-pulse h-3 w-3 shrink-0 rounded-full bg-primary" />
      <div className="relative h-6 flex-1">
        <span className="smb-track absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2" />
        <Bus
          size={20}
          aria-hidden
          className="smb-bus-run absolute top-1/2 text-primary"
        />
      </div>
      <span
        className="smb-stop-pulse h-3 w-3 shrink-0 rounded-full bg-primary"
        style={{ animationDelay: '0.6s' }}
      />
    </div>
  );
}

function JourneySkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2.5">
          <Shimmer className="h-9 w-12" />
          <Shimmer className="h-3 w-24" />
        </div>
        <Shimmer className="h-3 w-16" />
      </div>
      <div className="flex items-center gap-3 px-4 py-4">
        <div className="w-20 shrink-0 space-y-2">
          <Shimmer className="h-5 w-14" />
          <Shimmer className="h-3 w-20" />
        </div>
        <div className="flex flex-1 flex-col items-center gap-2">
          <Shimmer className="h-3 w-16" />
          <div className="flex w-full items-center">
            <span className="h-2.5 w-2.5 rounded-full bg-surface-variant" />
            <span className="h-0.5 flex-1 bg-border" />
            <Bus size={14} className="mx-1 text-border" />
            <span className="h-0.5 flex-1 bg-border" />
            <span className="h-2.5 w-2.5 rounded-full bg-surface-variant" />
          </div>
        </div>
        <div className="flex w-20 shrink-0 flex-col items-end gap-2">
          <Shimmer className="h-5 w-14" />
          <Shimmer className="h-3 w-20" />
        </div>
      </div>
      <div className="flex justify-center border-t border-border py-2.5">
        <Shimmer className="h-3 w-24" />
      </div>
    </Card>
  );
}

function DirectionsSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-surface-variant px-4 py-3">
        <Shimmer className="h-4 w-24" />
        <Shimmer className="h-4 w-20" />
      </div>
      <div className="p-4">
        <Shimmer className="h-40 w-full rounded-xl" />
        <div className="mt-3 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex gap-3">
              <Shimmer className="h-5 w-5 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Shimmer className={cn('h-3', i % 2 === 0 ? 'w-3/4' : 'w-1/2')} />
                <Shimmer className="h-2.5 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

/**
 * The waiting state for a route search: an animated bus, a message that keeps
 * moving so a slow API still feels alive, and skeletons shaped like the cards
 * that are about to land — so results fill in instead of shoving the page down.
 */
export function SearchingState({
  variant = 'journeys',
  date,
}: {
  variant?: 'journeys' | 'directions';
  date?: Date;
}) {
  const { t } = useTranslation();
  const messages = variant === 'directions' ? DIRECTIONS_MESSAGES : JOURNEY_MESSAGES;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % messages.length),
      MESSAGE_INTERVAL_MS,
    );
    return () => window.clearInterval(id);
  }, [messages]);

  // Only the timetables line claims "today"; swap it for a date-aware variant
  // so the message tracks what the rider actually searched for.
  const [baseKey, baseDefaultValue] = messages[index];
  const { key, defaultValue, params } = useMemo(() => {
    if (baseKey !== 'searchingTimetables') {
      return { key: baseKey, defaultValue: baseDefaultValue, params: undefined };
    }
    return timetablesMessage(date);
  }, [baseKey, baseDefaultValue, date]);

  const options = params ? { defaultValue, ...params } : { defaultValue };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-3 py-2">
        <div className="w-full max-w-xs">
          <BusTrack />
        </div>
        <p
          key={key}
          aria-live="polite"
          className="smb-msg-in text-sm font-medium text-muted"
        >
          {t(key, options)}
        </p>
      </div>
      {variant === 'directions' ? (
        <>
          <DirectionsSkeleton />
          <DirectionsSkeleton />
        </>
      ) : (
        <>
          <JourneySkeleton />
          <JourneySkeleton />
          <JourneySkeleton />
        </>
      )}
    </div>
  );
}
