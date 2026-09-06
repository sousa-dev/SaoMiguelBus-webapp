import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';

import { Card, Skeleton } from '@/components/ui';
import { formatCirculationRows, stopDisplayNameFromCirculations } from '@/features/live/lib/liveEtas';
import { formatVehicleStatusLabel, vehicleStatusI18nKeys } from '@/features/live/lib/vehicleStatus';
import { azoresbusColorHex } from '@/features/transit/live/lib/vehicleLine';
import { cn } from '@/lib/cn';
import type { AzoresbusVehicleDetail, AzoresbusVehicleSummary } from '@/lib/types';

const STATUS_KEYS = vehicleStatusI18nKeys('azoresbusLive');

type Props = {
  summary: AzoresbusVehicleSummary | undefined;
  detail: AzoresbusVehicleDetail | undefined;
  isLoading: boolean;
  onClose: () => void;
};

/** The selected bus: line, movement state, delay and its remaining stops with ETAs. */
export function LiveVehiclePanel({ summary, detail, isLoading, onClose }: Props) {
  const { t } = useTranslation();
  const route = detail?.route ?? summary?.route ?? null;
  const circulations = detail?.journey?.circulations;
  const currentStopSequence = detail?.currentStopSequence ?? null;
  const nextStopName = stopDisplayNameFromCirculations(circulations, currentStopSequence);
  const rows = formatCirculationRows(circulations, currentStopSequence, {
    now: t('azoresbusLiveEtaNow'),
    minutes: (count) => t('azoresbusLiveEtaMinutes', { count }),
    unavailable: '—',
  });
  const delaySeconds = summary?.delay ?? detail?.delay ?? null;
  const lateMinutes = delaySeconds != null && delaySeconds >= 60 ? Math.round(delaySeconds / 60) : null;

  return (
    <Card as="section" className="p-4" data-testid="vehicle-panel">
      <div className="flex items-start gap-3">
        <span
          className="inline-flex min-w-11 items-center justify-center rounded-lg px-2 py-1 text-sm font-extrabold text-white"
          style={{ backgroundColor: azoresbusColorHex(route?.color ?? summary?.color) }}
        >
          {route?.nameShort ?? '?'}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-content">
            {route?.nameShort
              ? t('azoresbusLiveVehicleTitle', { line: route.nameShort })
              : t('azoresbusLiveVehicleTitleUnknown')}
          </p>
          {route?.name ? <p className="truncate text-xs text-muted">{route.name}</p> : null}
          <p className="mt-1 text-xs text-content">
            {formatVehicleStatusLabel(detail?.status ?? summary?.busStatus ?? summary?.status, t, {
              keys: STATUS_KEYS,
              nextStopName,
            })}
            {lateMinutes != null ? (
              <span className="text-warning"> · {t('azoresbusLiveDelayMinutes', { count: lateMinutes })}</span>
            ) : null}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('close')}
          className="rounded-lg p-1 text-muted hover:bg-surface-variant hover:text-content"
        >
          <X size={18} />
        </button>
      </div>

      {isLoading && !detail ? (
        <div className="mt-3 flex flex-col gap-2">
          <Skeleton className="h-4" />
          <Skeleton className="h-4" />
        </div>
      ) : rows.length === 0 ? (
        <p className="mt-3 text-xs text-muted">{t('azoresbusLiveNoEtas')}</p>
      ) : (
        <ol className="mt-3 max-h-64 overflow-y-auto">
          {rows.map((row) => {
            const label = (
              <>
                <span className={cn('min-w-0 flex-1 truncate', row.isCurrent && 'font-bold text-primary')}>
                  {row.stopName}
                  {row.stopCode ? <span className="ml-1 text-muted">({row.stopCode})</span> : null}
                </span>
                <span className={cn('shrink-0 tabular-nums', row.isCurrent ? 'font-bold text-primary' : 'text-muted')}>
                  {row.etaLabel}
                </span>
              </>
            );
            return (
              <li key={row.sequence} className="border-b border-border last:border-b-0">
                {row.stopId != null ? (
                  <Link to={`/transit/stop/${row.stopId}`} className="flex items-center gap-2 py-1.5 text-sm hover:bg-surface-variant">
                    {label}
                  </Link>
                ) : (
                  <div className="flex items-center gap-2 py-1.5 text-sm">{label}</div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}
