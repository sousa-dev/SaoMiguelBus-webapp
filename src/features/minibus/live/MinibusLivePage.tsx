import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import { Radio, X } from 'lucide-react';

import { LiveVehicleMap, type LiveMapVehicle } from '@/components/map/LiveVehicleMap';
import { BackLink, PageHeader } from '@/components/layout/Page';
import { Seo } from '@/components/Seo';
import { Card, CenteredSpinner, Skeleton, Spinner } from '@/components/ui';
import { AdBanner } from '@/features/ads/components/AdBanner';
import { formatCirculationRows, stopDisplayNameFromCirculations } from '@/features/live/lib/liveEtas';
import { buildTrackingFreshnessLabels } from '@/features/live/lib/trackingFreshness';
import { formatVehicleStatusLabel, vehicleStatusI18nKeys } from '@/features/live/lib/vehicleStatus';
import { useMinibusLines } from '@/features/minibus/hooks';
import {
  isMinibusTrackingAvailable,
  useMinibusTrackingHealth,
} from '@/features/minibus/live/hooks/useMinibusTrackingHealth';
import { useMinibusVehicleDetail, useMinibusVehicles } from '@/features/minibus/live/hooks/useMinibusTrackingQueries';
import {
  filterVehiclesByLineSlug,
  resolveLineForVehicle,
  vehicleLineColorHex,
} from '@/features/minibus/live/lib/vehicleColor';
import { TrackingUnavailable } from '@/features/transit/live/components/TrackingUnavailable';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/cn';
import { useDocumentVisible } from '@/lib/hooks/useDocumentVisible';
import { useNetworkOnline } from '@/lib/hooks/useNetworkOnline';
import { decodePolyline } from '@/lib/polyline';
import type { MinibusLine, MinibusTrackingMeta, MinibusVehicleDetail, MinibusVehicleSummary } from '@/lib/types';

const TRY_AGAIN_COOLDOWN_MS = 10_000;
const STATUS_KEYS = vehicleStatusI18nKeys('minibusLive');

/** Ponta Delgada city centre — the PDL MiniBus service area, not the whole island. */
const MINIBUS_MAP_CENTER = { lat: 37.7394, lng: -25.6754 };
const MINIBUS_MAP_ZOOM = 13;

function MinibusFreshness({ meta, isRefetching }: { meta: MinibusTrackingMeta | undefined; isRefetching: boolean }) {
  const { t, i18n } = useTranslation();
  const labels = buildTrackingFreshnessLabels(
    meta,
    {
      intervalSeconds: (count) => t('minibusLiveUpdateIntervalSeconds', { count }),
      intervalMinutes: (count) => t('minibusLiveUpdateIntervalMinutes', { count }),
    },
    i18n.language,
  );
  return (
    <div className="flex items-center justify-between gap-2 text-xs text-muted">
      <div className="flex min-w-0 items-center gap-2">
        <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-danger px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
          <Radio size={10} strokeWidth={2.5} />
          {t('minibusLiveTracking')}
        </span>
        <span className="truncate">
          {labels?.updatedAtTime ? t('minibusLiveLastUpdated', { time: labels.updatedAtTime }) : null}
          {labels?.updatedAtTime && labels?.intervalTime ? ' · ' : null}
          {labels?.intervalTime ? t('minibusLiveUpdateInterval', { interval: labels.intervalTime }) : null}
          {labels?.isStale ? ` · ${t('minibusLiveStale')}` : null}
        </span>
      </div>
      {isRefetching ? (
        <span className="inline-flex shrink-0 items-center gap-1">
          <Spinner className="h-3 w-3" />
          {t('minibusLiveUpdating')}
        </span>
      ) : null}
    </div>
  );
}

function MinibusVehiclePanel({
  summary,
  line,
  detail,
  isLoading,
  onClose,
}: {
  summary: MinibusVehicleSummary | undefined;
  line: MinibusLine | null;
  detail: MinibusVehicleDetail | undefined;
  isLoading: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const circulations = detail?.journey?.circulations;
  const currentStopSequence = detail?.currentStopSequence ?? null;
  const nextStopName = stopDisplayNameFromCirculations(circulations, currentStopSequence);
  const rows = formatCirculationRows(circulations, currentStopSequence, {
    now: t('minibusLiveEtaNow'),
    minutes: (count) => t('minibusLiveEtaMinutes', { count }),
    unavailable: '—',
  });
  return (
    <Card as="section" className="p-4" data-testid="vehicle-panel">
      <div className="flex items-start gap-3">
        <span
          className="inline-flex min-w-11 items-center justify-center rounded-lg px-2 py-1 text-sm font-extrabold text-white"
          style={{ backgroundColor: line?.color ? `#${line.color.replace(/^#/, '')}` : '#2563eb' }}
        >
          {line?.code ?? '?'}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-content">
            {line ? t('minibusLiveVehicleTitle', { line: line.code }) : t('minibusLiveVehicleTitleUnknown')}
          </p>
          {line?.name ? <p className="truncate text-xs text-muted">{line.name}</p> : null}
          <p className="mt-1 text-xs text-content">
            {formatVehicleStatusLabel(detail?.status ?? summary?.status, t, { keys: STATUS_KEYS, nextStopName })}
          </p>
        </div>
        <button type="button" onClick={onClose} aria-label={t('close')} className="rounded-lg p-1 text-muted hover:bg-surface-variant">
          <X size={18} />
        </button>
      </div>
      {isLoading && !detail ? (
        <div className="mt-3 flex flex-col gap-2">
          <Skeleton className="h-4" />
          <Skeleton className="h-4" />
        </div>
      ) : rows.length === 0 ? (
        <p className="mt-3 text-xs text-muted">{t('minibusLiveNoEtas')}</p>
      ) : (
        <ol className="mt-3 max-h-64 overflow-y-auto">
          {rows.map((row) => (
            <li key={row.sequence} className="flex items-center gap-2 border-b border-border py-1.5 text-sm last:border-b-0">
              <span className={cn('min-w-0 flex-1 truncate', row.isCurrent && 'font-bold text-primary')}>{row.stopName}</span>
              <span className={cn('shrink-0 tabular-nums', row.isCurrent ? 'font-bold text-primary' : 'text-muted')}>{row.etaLabel}</span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

/** `/minibus/live` — the PDL MiniBus fleet on a map (free; a lighter port of the Expo screen). */
export function MinibusLivePage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const initialLine = params.get('line') || null;
  const isOnline = useNetworkOnline();
  const visible = useDocumentVisible();
  const [selectedLineSlug, setSelectedLineSlug] = useState<string | null>(initialLine);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  const healthQuery = useMinibusTrackingHealth({ enabled: isOnline });
  const trackingAvailable = isOnline && isMinibusTrackingAvailable(healthQuery.data);
  const screenActive = visible && trackingAvailable;
  const fleetQuery = useMinibusVehicles({ enabled: trackingAvailable, screenActive });
  const detailQuery = useMinibusVehicleDetail(selectedVehicleId, {
    enabled: trackingAvailable && selectedVehicleId != null,
    screenActive: screenActive && selectedVehicleId != null,
  });
  const linesQuery = useMinibusLines();
  const lines = useMemo(() => linesQuery.data?.lines ?? [], [linesQuery.data]);

  const vehicles = useMemo(() => fleetQuery.data?.vehicles ?? [], [fleetQuery.data]);
  const visibleVehicles = useMemo(
    () => filterVehiclesByLineSlug(vehicles, lines, selectedLineSlug),
    [lines, selectedLineSlug, vehicles],
  );
  const mapVehicles = useMemo<LiveMapVehicle[]>(
    () =>
      visibleVehicles.map((vehicle) => ({
        id: vehicle.id,
        position: vehicle.position,
        lineCode: resolveLineForVehicle(vehicle, lines)?.code ?? null,
        color: vehicleLineColorHex(vehicle, lines),
      })),
    [lines, visibleVehicles],
  );
  const routePolyline = useMemo(() => {
    const shape = detailQuery.data?.vehicle.journey?.shape;
    if (!shape) return undefined;
    const points = decodePolyline(shape);
    return points.length > 1 ? points : undefined;
  }, [detailQuery.data?.vehicle.journey?.shape]);

  useEffect(() => {
    track('minibus', 'live_view', { screen: 'live' });
  }, []);

  useEffect(() => {
    if (cooldownUntil === 0) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
      setCooldownSeconds(remaining);
      if (remaining === 0) setCooldownUntil(0);
    };
    tick();
    const timer = setInterval(tick, 250);
    return () => clearInterval(timer);
  }, [cooldownUntil]);

  const onTryAgain = useCallback(() => {
    setCooldownUntil(Date.now() + TRY_AGAIN_COOLDOWN_MS);
    void healthQuery.refetchHealth({ force: true });
  }, [healthQuery]);

  const selectedSummary = vehicles.find((v) => v.id === selectedVehicleId);
  const selectedLine = selectedSummary ? resolveLineForVehicle(selectedSummary, lines) : null;
  const hasFleet = trackingAvailable && vehicles.length > 0;

  let body: React.ReactNode;
  if (!isOnline) {
    body = <TrackingUnavailable variant="offline" keyPrefix="minibusLive" />;
  } else if (healthQuery.isPending && healthQuery.data == null) {
    body = <CenteredSpinner />;
  } else if (!trackingAvailable) {
    body = (
      <TrackingUnavailable
        keyPrefix="minibusLive"
        onTryAgain={onTryAgain}
        tryAgainDisabled={cooldownSeconds > 0 || healthQuery.isFetching}
        tryAgainLabel={
          cooldownSeconds > 0 ? t('minibusLiveTryAgainWait', { seconds: cooldownSeconds }) : t('minibusLiveTryAgain')
        }
      />
    );
  } else {
    const chip = (active: boolean) =>
      cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold transition',
        active ? 'border-primary bg-primary text-on-primary' : 'border-border bg-surface text-content hover:border-outline',
      );
    body = (
      <div className="flex flex-col gap-3">
        {lines.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setSelectedLineSlug(null)} className={chip(selectedLineSlug == null)}>
              {t('minibusLiveFilterAll')}
            </button>
            {lines.map((line) => (
              <button
                key={line.slug}
                type="button"
                aria-pressed={selectedLineSlug === line.slug}
                onClick={() => setSelectedLineSlug(selectedLineSlug === line.slug ? null : line.slug)}
                className={chip(selectedLineSlug === line.slug)}
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: `#${line.color.replace(/^#/, '')}` }} />
                {line.code}
              </button>
            ))}
          </div>
        ) : null}
        <MinibusFreshness meta={fleetQuery.data} isRefetching={fleetQuery.isRefetching} />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
          <div className="relative isolate z-0 h-[60vh] min-h-80 overflow-hidden rounded-2xl border border-border">
            <LiveVehicleMap
              vehicles={mapVehicles}
              selectedVehicleId={selectedVehicleId}
              focusVehicleId={selectedVehicleId}
              routePolyline={routePolyline}
              routeColor={selectedLine?.color ? `#${selectedLine.color.replace(/^#/, '')}` : null}
              onSelectVehicle={(id) => setSelectedVehicleId(id)}
              fallbackCenter={MINIBUS_MAP_CENTER}
              fallbackZoom={MINIBUS_MAP_ZOOM}
            />
            {fleetQuery.isPending ? (
              <div className="pointer-events-none absolute inset-0 z-[500] flex items-center justify-center bg-surface/60">
                <CenteredSpinner />
              </div>
            ) : vehicles.length === 0 ? (
              <div className="pointer-events-none absolute inset-x-0 top-3 z-[500] flex justify-center">
                <span className="rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-muted shadow">
                  {t('minibusLiveEmpty')}
                </span>
              </div>
            ) : null}
          </div>
          {selectedVehicleId ? (
            <MinibusVehiclePanel
              summary={selectedSummary}
              line={selectedLine}
              detail={detailQuery.data?.vehicle}
              isLoading={detailQuery.isPending}
              onClose={() => setSelectedVehicleId(null)}
            />
          ) : null}
        </div>
        {fleetQuery.data?.trackingAttribution ? (
          <p className="text-xs text-muted">
            {fleetQuery.data.trackingAttribution}
            {fleetQuery.data.trackingSourceUrl ? (
              <>
                {' · '}
                <a href={fleetQuery.data.trackingSourceUrl} target="_blank" rel="noreferrer" className="underline">
                  {t('minibusLiveAttributionLink')}
                </a>
              </>
            ) : null}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <Seo modulePath="/minibus/live" />
      <BackLink to="/minibus" label={t('navBarMinibusLabel')} />
      <PageHeader title={t('minibusLiveTitle')} />
      <div className="mb-4 empty:hidden">
        <AdBanner on="minibus" slot="top" content={hasFleet} />
      </div>
      {body}
      <p className="sr-only">
        <Link to="/minibus">{t('navBarMinibusLabel')}</Link>
      </p>
    </>
  );
}
