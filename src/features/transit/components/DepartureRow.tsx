import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { displayRouteNumber, splitStopLabel } from '@/lib/format';
import type { TransitStopDeparture } from '@/lib/types';

/**
 * One departure, shared by the stop page and the trip detail page's "rest of the
 * line".
 *
 * It renders `destination`, NEVER `headsign`. The upstream `headsign` is a time
 * range — `"08:00 » 08:50"` — not a destination, so showing it answers a
 * question nobody asked. `destination` is the trip's last stop by sequence,
 * which is the honest answer to "where is this bus going?".
 */
export function DepartureRow({ departure }: { departure: TransitStopDeparture }) {
  const { t } = useTranslation();
  const destination = departure.destination
    ? splitStopLabel(departure.destination).title
    : t('transitDirectJourney');

  return (
    <Link
      to={`/transit/trip/${departure.tripId}`}
      className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-variant"
    >
      <span className="flex h-8 min-w-8 shrink-0 items-center justify-center rounded-lg bg-primary px-1.5 text-sm font-bold text-on-primary">
        {displayRouteNumber(departure.route)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-content">{destination}</span>
        {departure.code ? (
          <span className="block text-xs text-muted">{departure.code}</span>
        ) : null}
      </span>
      <span className="shrink-0 text-sm font-bold text-content">
        {departure.time}
        {departure.dayOffset > 0 ? (
          <span className="ml-1 rounded bg-surface-variant px-1 text-[10px] font-bold text-muted">
            +{departure.dayOffset}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
