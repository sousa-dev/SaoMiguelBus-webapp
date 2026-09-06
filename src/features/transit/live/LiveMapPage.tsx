import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';

import { LiveVehicleMap, type LiveMapVehicle } from '@/components/map/LiveVehicleMap';
import { BackLink, PageHeader } from '@/components/layout/Page';
import { Seo } from '@/components/Seo';
import { CenteredSpinner } from '@/components/ui';
import { AdBanner } from '@/features/ads/components/AdBanner';
import { LiveLineFilter } from '@/features/transit/live/components/LiveLineFilter';
import { LiveVehiclePanel } from '@/features/transit/live/components/LiveVehiclePanel';
import { TrackingFreshness } from '@/features/transit/live/components/TrackingFreshness';
import { TrackingUnavailable } from '@/features/transit/live/components/TrackingUnavailable';
import {
  isAzoresbusTrackingAvailable,
  useAzoresbusTrackingHealth,
} from '@/features/transit/live/hooks/useAzoresbusTrackingHealth';
import {
  useAzoresbusVehicleDetail,
  useAzoresbusVehicles,
} from '@/features/transit/live/hooks/useAzoresbusTrackingQueries';
import {
  azoresbusFleetLines,
  azoresbusVehicleColorHex,
  azoresbusVehicleLineCode,
  filterVehiclesByLineCodes,
} from '@/features/transit/live/lib/vehicleLine';
import { track } from '@/lib/analytics';
import { useDocumentVisible } from '@/lib/hooks/useDocumentVisible';
import { useNetworkOnline } from '@/lib/hooks/useNetworkOnline';
import { decodePolyline } from '@/lib/polyline';

const TRY_AGAIN_COOLDOWN_MS = 10_000;

/** `/transit/live` — the AzoresBus fleet on a map (free; mirrors the Expo live screen). */
export function LiveMapPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const initialLine = params.get('line') || null;
  const initialVehicle = params.get('vehicle') || null;

  const isOnline = useNetworkOnline();
  const visible = useDocumentVisible();
  const [selectedLineCodes, setSelectedLineCodes] = useState<string[]>(initialLine ? [initialLine] : []);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(initialVehicle);
  const [focusVehicleId, setFocusVehicleId] = useState<string | null>(null);
  const centredOnDeepLink = useRef(false);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  const healthQuery = useAzoresbusTrackingHealth({ enabled: isOnline });
  const trackingAvailable = isOnline && isAzoresbusTrackingAvailable(healthQuery.data);
  const screenActive = visible && trackingAvailable;

  const fleetQuery = useAzoresbusVehicles({ enabled: trackingAvailable, screenActive });
  const detailQuery = useAzoresbusVehicleDetail(selectedVehicleId, {
    enabled: trackingAvailable && selectedVehicleId != null,
    screenActive: screenActive && selectedVehicleId != null,
  });

  const vehicles = useMemo(() => fleetQuery.data?.vehicles ?? [], [fleetQuery.data]);
  const fleetLines = useMemo(() => azoresbusFleetLines(vehicles), [vehicles]);
  const visibleVehicles = useMemo(
    () => filterVehiclesByLineCodes(vehicles, selectedLineCodes),
    [selectedLineCodes, vehicles],
  );
  const mapVehicles = useMemo<LiveMapVehicle[]>(
    () =>
      visibleVehicles.map((vehicle) => ({
        id: vehicle.id,
        position: vehicle.position,
        lineCode: azoresbusVehicleLineCode(vehicle),
        color: azoresbusVehicleColorHex(vehicle),
      })),
    [visibleVehicles],
  );

  // Only the selected bus's shape is decoded: every vehicle carries a multi-kilobyte polyline.
  const routePolyline = useMemo(() => {
    const shape = detailQuery.data?.journey?.shape;
    if (!shape) return undefined;
    const points = decodePolyline(shape);
    return points.length > 1 ? points : undefined;
  }, [detailQuery.data?.journey?.shape]);

  useEffect(() => {
    track('transit', 'live_view', { screen: 'live' });
  }, []);

  useEffect(() => {
    if (initialLine) track('transit', 'live_filter', { source: 'deep_link', line: initialLine });
  }, [initialLine]);

  // Centre on a deep-linked bus once the fleet actually arrives, and only once.
  useEffect(() => {
    if (!initialVehicle || centredOnDeepLink.current || vehicles.length === 0) return;
    if (!vehicles.some((item) => item.id === initialVehicle)) return;
    centredOnDeepLink.current = true;
    track('transit', 'live_select', { kind: 'vehicle', source: 'deep_link', vehicle: initialVehicle });
    // Syncs the map focus to a deep link only once the fleet it refers to has actually arrived.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFocusVehicleId(initialVehicle);
  }, [initialVehicle, vehicles]);

  // Countdown for the retry button, so it reads as "wait" rather than "broken".
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
    track('transit', 'live_health', { action: 'retry' });
    setCooldownUntil(Date.now() + TRY_AGAIN_COOLDOWN_MS);
    void healthQuery.refetchHealth({ force: true });
  }, [healthQuery]);

  const onSelectVehicle = useCallback((vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    setFocusVehicleId(vehicleId);
    track('transit', 'live_select', { kind: 'vehicle', source: 'map', vehicle: vehicleId });
  }, []);

  const selectedSummary = vehicles.find((v) => v.id === selectedVehicleId);
  const hasFleet = trackingAvailable && vehicles.length > 0;

  let body: React.ReactNode;
  if (!isOnline) {
    body = <TrackingUnavailable variant="offline" />;
  } else if (healthQuery.isPending && healthQuery.data == null) {
    body = <CenteredSpinner />;
  } else if (!trackingAvailable) {
    body = (
      <TrackingUnavailable
        onTryAgain={onTryAgain}
        tryAgainDisabled={cooldownSeconds > 0 || healthQuery.isFetching}
        tryAgainLabel={
          cooldownSeconds > 0 ? t('azoresbusLiveTryAgainWait', { seconds: cooldownSeconds }) : t('azoresbusLiveTryAgain')
        }
      />
    );
  } else {
    body = (
      <div className="flex flex-col gap-3">
        <LiveLineFilter
          lines={fleetLines}
          selected={selectedLineCodes}
          onChange={(codes) => {
            setSelectedLineCodes(codes);
            track('transit', 'live_filter', { source: codes.length ? 'chip' : 'clear', line: codes.join(',') || null });
          }}
        />
        <TrackingFreshness updatedAt={fleetQuery.dataUpdatedAt} isRefetching={fleetQuery.isRefetching} />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
          <div className="relative isolate z-0 h-[60vh] min-h-80 overflow-hidden rounded-2xl border border-border">
            <LiveVehicleMap
              vehicles={mapVehicles}
              selectedVehicleId={selectedVehicleId}
              focusVehicleId={focusVehicleId}
              routePolyline={routePolyline}
              routeColor={detailQuery.data?.route?.color ? `#${detailQuery.data.route.color.replace(/^#/, '')}` : null}
              onSelectVehicle={onSelectVehicle}
            />
            {fleetQuery.isPending ? (
              <div className="pointer-events-none absolute inset-0 z-[500] flex items-center justify-center bg-surface/60">
                <CenteredSpinner />
              </div>
            ) : vehicles.length === 0 ? (
              <div className="pointer-events-none absolute inset-x-0 top-3 z-[500] flex justify-center">
                <span className="rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-muted shadow">
                  {t('azoresbusLiveEmpty')}
                </span>
              </div>
            ) : null}
          </div>
          {selectedVehicleId ? (
            <LiveVehiclePanel
              summary={selectedSummary}
              detail={detailQuery.data}
              isLoading={detailQuery.isPending}
              onClose={() => {
                setSelectedVehicleId(null);
                setFocusVehicleId(null);
              }}
            />
          ) : null}
        </div>
        <p className="text-xs text-muted">{t('azoresbusLiveAttribution')}</p>
      </div>
    );
  }

  return (
    <>
      <Seo modulePath="/transit/live" />
      <BackLink to="/transit" label={t('navBarSearchLabel')} />
      <PageHeader title={t('azoresbusLiveTitle')} />
      <div className="mb-4 empty:hidden">
        <AdBanner on="live" slot="top" content={hasFleet} />
      </div>
      {body}
    </>
  );
}
