import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, MapPin, Search } from 'lucide-react';

import { Card, CenteredSpinner } from '@/components/ui';
import { MapView, type MapPoint } from '@/components/MapView';
import { Seo } from '@/components/Seo';
import { BackLink, PageHeader } from '@/components/layout/Page';
import { useStops } from '@/features/transit/hooks';
import { useDebounced } from '@/hooks/useDebounced';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/cn';
import { splitStopLabel } from '@/lib/format';
import { foldForSearch } from '@/lib/stop-search';
import type { Stop } from '@/lib/types';

/**
 * The whole network on one map.
 *
 * Three ways to reach a stop — the search field, the list, and the `‹ ›` focus
 * bar — all driving one `focusedStopId`, and one rule across all three: the
 * first interaction FOCUSES, a second on the same stop OPENS it. Without that,
 * a tap on a pin either navigates away before the rider has looked at it, or
 * never navigates at all.
 */
export function NetworkPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: stops = [], isLoading } = useStops();

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounced(query, 300);
  const [focusedStopId, setFocusedStopId] = useState<number | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    track('transit', 'network_view', {});
  }, []);

  // Placeable stops only — a stop with no coordinates cannot be a pin, and
  // (0, 0) would put it in the Gulf of Guinea.
  const placeable = useMemo(
    () =>
      stops.filter(
        (stop) =>
          Number.isFinite(stop.latitude) &&
          Number.isFinite(stop.longitude) &&
          !(stop.latitude === 0 && stop.longitude === 0),
      ),
    [stops],
  );

  const listStops = useMemo(() => {
    const q = foldForSearch(debouncedQuery);
    const matched = q
      ? placeable.filter((stop) => foldForSearch(stop.name).includes(q))
      : placeable;
    return [...matched].sort((a, b) => a.name.localeCompare(b.name));
  }, [placeable, debouncedQuery]);

  const focusedIndex = listStops.findIndex((stop) => stop.id === focusedStopId);
  const focused = focusedIndex >= 0 ? listStops[focusedIndex] : null;

  /** First interaction focuses; a second on the same stop opens it. */
  const activate = (stop: Stop) => {
    if (focusedStopId === stop.id) {
      navigate(`/transit/stop/${stop.id}`);
      return;
    }
    setFocusedStopId(stop.id);
  };

  const step = (delta: number) => {
    if (listStops.length === 0) return;
    // Wraps at both ends, so walking the list never dead-ends.
    const next = (focusedIndex + delta + listStops.length) % listStops.length;
    setFocusedStopId(listStops[next].id);
    listRef.current
      ?.querySelector(`[data-stop-id="${listStops[next].id}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  };

  if (isLoading) return <CenteredSpinner />;

  const points: MapPoint[] = listStops.map((stop) => {
    const isFocused = stop.id === focusedStopId;
    return {
      id: stop.id,
      lat: stop.latitude,
      lng: stop.longitude,
      color: isFocused ? '#6366f1' : undefined,
      // Bigger AND a different colour: on a map of hundreds of identical pins,
      // colour alone cannot pick one out.
      radius: isFocused ? 11 : 4,
      popup: (
        <span className="text-xs">
          <strong>{stop.name}</strong>
          <br />
          {t('transitNetworkOpenStop')}
        </span>
      ),
      // A pin the rider can already see does not need the map to move.
      onClick: () => activate(stop),
    };
  });

  return (
    <>
      <Seo modulePath="/transit/network" />
      <BackLink to="/transit" label={t('navBarSearchLabel')} />
      <PageHeader
        title={t('transitNetworkMap')}
        subtitle={t('transitNetworkTapStop')}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-2">
          <div
            className="h-[30rem] overflow-hidden rounded-2xl border border-border"
            aria-label={t('transitNetworkMapA11y')}
          >
            <MapView points={points} />
          </div>

          {focused ? (
            <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2">
              <button
                type="button"
                aria-label={t('transitNetworkPreviousStop')}
                onClick={() => step(-1)}
                className="rounded-lg p-1.5 text-muted hover:bg-surface-variant hover:text-content"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => activate(focused)}
                className="min-w-0 flex-1 text-left"
              >
                <span className="block truncate text-sm font-semibold text-content">
                  {splitStopLabel(focused.name).title}
                </span>
                <span className="block text-xs text-muted">
                  {focusedIndex + 1}/{listStops.length} · {t('transitTapAgainOpensStop')}
                </span>
              </button>
              <button
                type="button"
                aria-label={t('transitNetworkNextStop')}
                onClick={() => step(1)}
                className="rounded-lg p-1.5 text-muted hover:bg-surface-variant hover:text-content"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          ) : null}
        </div>

        <Card className="flex max-h-[34rem] flex-col overflow-hidden">
          <div className="relative border-b border-border p-3">
            <Search
              size={16}
              className="pointer-events-none absolute left-6 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('transitNetworkSearchPlaceholder')}
              className="h-10 w-full rounded-xl border border-border bg-surface pl-9 pr-3 text-sm text-content placeholder:text-muted focus:border-primary focus:outline-none"
            />
          </div>

          {listStops.length === 0 ? (
            <p className="p-4 text-sm text-muted">{t('transitNetworkNoMatches')}</p>
          ) : (
            <ul ref={listRef} className="flex-1 divide-y divide-border overflow-auto">
              {listStops.map((stop) => {
                const label = splitStopLabel(stop.name);
                return (
                  <li key={stop.name} data-stop-id={stop.id}>
                    <button
                      type="button"
                      onClick={() => activate(stop)}
                      className={cn(
                        'flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-surface-variant',
                        stop.id === focusedStopId && 'bg-surface-variant',
                      )}
                    >
                      <MapPin
                        size={14}
                        className={cn(
                          'shrink-0',
                          stop.id === focusedStopId ? 'text-primary' : 'text-muted',
                        )}
                      />
                      <span className="min-w-0 flex-1 truncate text-sm text-content">
                        {label.title}
                        {label.subtitle ? (
                          <span className="text-muted"> · {label.subtitle}</span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
