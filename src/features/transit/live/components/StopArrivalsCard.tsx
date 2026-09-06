import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

import { Card, Spinner } from '@/components/ui';
import { TrackingFreshness } from '@/features/transit/live/components/TrackingFreshness';
import { LIVE_MAP_PATH } from '@/features/transit/live/components/LiveEntryCard';
import {
  isAzoresbusTrackingAvailable,
  useAzoresbusTrackingHealth,
} from '@/features/transit/live/hooks/useAzoresbusTrackingHealth';
import { useAzoresbusStopArrivals } from '@/features/transit/live/hooks/useAzoresbusTrackingQueries';
import { azoresbusColorHex } from '@/features/transit/live/lib/vehicleLine';
import { useDocumentVisible } from '@/lib/hooks/useDocumentVisible';
import { useNetworkOnline } from '@/lib/hooks/useNetworkOnline';

/**
 * Live buses inbound to one stop. Three empty-ish states that must not collapse into one: still
 * loading, feed unreachable, and genuinely nothing inbound (the common case after 21:00).
 */
export function StopArrivalsCard({ stopId }: { stopId: number }) {
  const { t } = useTranslation();
  const online = useNetworkOnline();
  const visible = useDocumentVisible();
  const health = useAzoresbusTrackingHealth({ enabled: online });
  const available = online && isAzoresbusTrackingAvailable(health.data);
  const arrivals = useAzoresbusStopArrivals(stopId, {
    enabled: available,
    screenActive: available && visible,
  });

  if (!available) return null;

  return (
    <Card as="section" className="p-4">
      <h2 className="mb-2 text-sm font-bold text-content">{t('azoresbusLiveStopArrivals')}</h2>
      {arrivals.isPending ? (
        <p className="flex items-center gap-2 py-3 text-xs text-muted">
          <Spinner className="h-4 w-4" />
          {t('azoresbusLiveStopSearching')}
        </p>
      ) : arrivals.isError ? (
        <p className="py-3 text-center text-xs text-muted">{t('azoresbusLiveUnavailable')}</p>
      ) : !arrivals.data?.arrivals.length ? (
        <p className="py-3 text-center text-xs text-muted">{t('azoresbusLiveStopNoArrivals')}</p>
      ) : (
        <>
          <TrackingFreshness updatedAt={arrivals.dataUpdatedAt} isRefetching={arrivals.isRefetching} />
          <ul className="mt-2 divide-y divide-border">
            {arrivals.data.arrivals.map((arrival) => (
              <li key={`${arrival.vehicleId}-${arrival.journeyId}`}>
                <Link
                  to={`${LIVE_MAP_PATH}?vehicle=${encodeURIComponent(arrival.vehicleId)}`}
                  className="flex items-center gap-3 py-2 hover:bg-surface-variant"
                >
                  <span
                    className="inline-flex min-w-11 items-center justify-center rounded-lg px-2 py-0.5 text-xs font-extrabold text-white"
                    style={{ backgroundColor: azoresbusColorHex(arrival.lineColor) }}
                  >
                    {arrival.lineCode || '—'}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-content">
                    {arrival.lineName || t('azoresbusLiveVehicleTitleUnknown')}
                  </span>
                  <span className={arrival.stale ? 'text-sm font-semibold text-muted' : 'text-sm font-semibold text-content'}>
                    {arrival.dueInMinutes <= 0
                      ? t('azoresbusLiveEtaNow')
                      : t(arrival.stale ? 'azoresbusLiveEtaApproxMinutes' : 'azoresbusLiveEtaMinutes', {
                          count: arrival.dueInMinutes,
                        })}
                  </span>
                  <ChevronRight size={14} className="shrink-0 text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}
