import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, LocateFixed, Map as MapIcon } from 'lucide-react';

import { EmptyState } from '@/components/ui';
import { BackLink } from '@/components/layout/Page';
import { Seo } from '@/components/Seo';
import { JourneyMap } from '@/features/transit/components/JourneyMap';
import { useJourneyGeometry } from '@/features/transit/hooks/useJourneyGeometry';
import {
  buildJourneyMapData,
  groupJourneySteps,
  type JourneyMapPin,
} from '@/features/transit/lib/journey-map-data';
import { formatWalkDistance, nearestStops } from '@/features/transit/lib/nearest-stop';
import { useUserLocation } from '@/lib/hooks/useUserLocation';
import { cn } from '@/lib/cn';
import type { TransitJourney, TransitJourneySearch } from '@/lib/types';

export function JourneyMapPage() {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const journeyId = searchParams.get('journeyId');
  const focusStopId = searchParams.get('focusStopId');
  const queryClient = useQueryClient();

  const [selected, setSelected] = useState<JourneyMapPin | null>(null);
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set());
  const { coords: userCoords, permission: locationPermission, request: requestLocation } =
    useUserLocation();

  const journey = useMemo((): TransitJourney | null => {
    if (!journeyId) return null;
    const caches = queryClient.getQueriesData<TransitJourneySearch>({
      queryKey: ['transit', 'journeys'],
    });
    for (const [, value] of caches) {
      const found = value?.journeys?.find((j) => j.id === journeyId);
      if (found) return found;
    }
    return null;
  }, [journeyId, queryClient]);

  const { geometries } = useJourneyGeometry(journey);
  const data = useMemo(
    () => (journey ? buildJourneyMapData(journey, geometries) : null),
    [journey, geometries],
  );
  const groups = useMemo(() => (data ? groupJourneySteps(data.pins) : []), [data]);
  const nearest = useMemo(
    () => (data && userCoords ? nearestStops(data.pins, userCoords) : null),
    [data, userCoords],
  );

  // Pre-select a stop the rider was pointed at from the card preview, and
  // open the group it lives in so it is visible in the list.
  useMemo(() => {
    if (!data || !focusStopId) return;
    const id = Number(focusStopId);
    const pin = data.pins.find((p) => p.stopId === id);
    if (!pin) return;
    setSelected(pin);
    const group = groups.find((g) => g.kind === 'stops' && g.pins.some((p) => p.stopId === id));
    if (group?.kind === 'stops') {
      setOpenGroups((current) => new Set(current).add(group.id));
    }
    // Only ever needs to run once, when the data first resolves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, focusStopId]);

  if (!journey) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <BackLink to="/transit" label={t('navBarSearchLabel')} />
        <EmptyState
          icon={MapIcon}
          title={t('transitMapUnavailable')}
          description={t('transitMapReopenSearch')}
        />
      </div>
    );
  }

  const toggleGroup = (id: string) =>
    setOpenGroups((current) => {
      const next = new Set(current);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  /** Same two-stage tap the mobile app uses: first select/focus, then open. */
  const selectOrOpen = (pin: JourneyMapPin) => {
    setSelected((current) => (current?.stopId === pin.stopId ? current : pin));
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Seo title={t('transitOpenMap')} />
      <BackLink to="/transit" label={t('navBarSearchLabel')} />

      <JourneyMap
        journey={journey}
        wholeTrip={false}
        className="h-80 md:h-[28rem]"
        onStopClick={selectOrOpen}
        highlightedStopId={selected?.stopId ?? nearest?.closer?.pin.stopId ?? null}
        userLocation={userCoords}
        onRequestLocation={requestLocation}
        showLocateControl
      />

      {locationPermission === 'denied' ? (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
          <LocateFixed size={14} />
          {t('transitLocationDenied')}
        </p>
      ) : null}

      {nearest?.closer ? (
        <button
          type="button"
          onClick={() => selectOrOpen(nearest.closer!.pin)}
          className="mt-3 flex w-full items-center gap-2 rounded-xl bg-surface-variant px-3 py-2 text-left text-sm text-content hover:bg-surface"
        >
          <LocateFixed size={14} className="shrink-0 text-primary" />
          <span>
            {t('transitCloserStopHint', {
              name: nearest.closer.pin.name,
              distance: formatWalkDistance(nearest.closer.metres, i18n.language),
            })}
          </span>
        </button>
      ) : null}

      <ol className="mt-4 flex flex-col gap-1.5">
        {groups.map((group) => {
          if (group.kind === 'action') {
            const pin = group.pin;
            const active = pin.stopId === selected?.stopId;
            const boardingDistance = nearest?.boarding.find((b) => b.pin.stopId === pin.stopId);
            return (
              <li key={pin.id}>
                <button
                  type="button"
                  onClick={() => selectOrOpen(pin)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl border border-border px-3 py-2 text-left',
                    active && 'bg-surface-variant',
                  )}
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold text-white"
                    style={{ backgroundColor: pin.color }}
                  >
                    {pin.step}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-content">
                      {pin.name}
                    </span>
                    <span className="block text-xs text-muted">
                      {pin.time}
                      {pin.code ? ` · ${pin.code}` : ''}
                    </span>
                    {boardingDistance ? (
                      <span className="block text-xs text-info">
                        {t('transitNearestBadge', {
                          distance: formatWalkDistance(boardingDistance.metres, i18n.language),
                        })}
                      </span>
                    ) : null}
                  </span>
                  <span className="shrink-0 text-xs text-muted">
                    {t(
                      pin.kind === 'board'
                        ? 'transitPinBoard'
                        : pin.kind === 'change'
                          ? 'transitPinChange'
                          : 'transitPinAlight',
                    )}
                  </span>
                </button>
              </li>
            );
          }

          const open = openGroups.has(group.id);
          return (
            <li key={group.id}>
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                className="flex items-center gap-1.5 py-1 pl-2 text-xs font-semibold text-muted"
              >
                {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                {t('transitStopsCount', { count: group.pins.length })}
              </button>
              {open ? (
                <ul className="ml-6 flex flex-col gap-1 border-l border-border pl-3">
                  {group.pins.map((pin) => (
                    <li key={pin.id}>
                      <button
                        type="button"
                        onClick={() => selectOrOpen(pin)}
                        className="flex w-full items-center justify-between gap-2 py-0.5 text-left text-xs text-muted hover:text-content"
                      >
                        <span className="truncate">{pin.name}</span>
                        <span className="shrink-0">{pin.time}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ol>

      {selected ? (
        <div className="mt-4">
          <Link
            to={`/transit/stop/${selected.stopId}`}
            className="inline-flex select-none items-center justify-center rounded-xl border border-border px-3 py-1.5 text-sm font-semibold text-content transition hover:bg-surface-variant"
          >
            {t('transitNetworkOpenStop')}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
