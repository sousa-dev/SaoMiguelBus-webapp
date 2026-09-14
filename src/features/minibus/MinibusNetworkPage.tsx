import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, MapPin, Search } from 'lucide-react';

import { Card, CenteredSpinner, SegmentedControl } from '@/components/ui';
import { MapView, type MapPoint } from '@/components/MapView';
import { Seo } from '@/components/Seo';
import { BackLink, PageHeader } from '@/components/layout/Page';
import { MinibusDocumentImage } from '@/features/minibus/components/MinibusDocumentImage';
import { MinibusLineCard } from '@/features/minibus/components/MinibusLineCard';
import { MinibusNetworkStopDialog } from '@/features/minibus/components/MinibusNetworkStopDialog';
import { useMinibusLines, useMinibusNetwork } from '@/features/minibus/hooks';
import { liveNetworkMapStops, type MinibusLiveMapStopPin } from '@/features/minibus/lib/liveNetworkMapStops';
import { useDebounced } from '@/hooks/useDebounced';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/cn';
import { foldForSearch } from '@/lib/stop-search';

const staticIslandMinibusCenter = { lat: 37.7394, lng: -25.6754 };

/**
 * The PDL MiniBus network on one interactive map — mirrors the AzoresBus
 * `/transit/network` page. Same rule across the search field, the list, and
 * the `‹ ›` focus bar: the first tap on a stop FOCUSES it, a second OPENS it
 * (the lines-served dialog), so a tap never fires the dialog before the rider
 * has actually looked at the pin.
 */
export function MinibusNetworkPage() {
  const { t } = useTranslation();
  const networkQuery = useMinibusNetwork();
  const linesQuery = useMinibusLines();

  const [tab, setTab] = useState<'map' | 'lines'>('map');
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounced(query, 300);
  const [focusedStopKey, setFocusedStopKey] = useState<string | null>(null);
  const [openPin, setOpenPin] = useState<MinibusLiveMapStopPin | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    track('minibus', 'view', { screen: 'network' });
  }, []);

  const pins = useMemo(
    () => liveNetworkMapStops(networkQuery.data ?? null, linesQuery.data?.lines ?? [], null),
    [linesQuery.data, networkQuery.data],
  );

  const listPins = useMemo(() => {
    const q = foldForSearch(debouncedQuery);
    const matched = q ? pins.filter((pin) => foldForSearch(pin.stop.name_pt).includes(q)) : pins;
    return [...matched].sort((a, b) => a.stop.name_pt.localeCompare(b.stop.name_pt, 'pt'));
  }, [pins, debouncedQuery]);

  const focusedIndex = listPins.findIndex((pin) => pin.stop.key === focusedStopKey);
  const focused = focusedIndex >= 0 ? listPins[focusedIndex] : null;

  /** First interaction focuses; a second on the same stop opens the lines dialog. */
  const activate = (pin: MinibusLiveMapStopPin) => {
    if (focusedStopKey === pin.stop.key) {
      setOpenPin(pin);
      return;
    }
    setFocusedStopKey(pin.stop.key);
  };

  const step = (delta: number) => {
    if (listPins.length === 0) return;
    const next = (focusedIndex + delta + listPins.length) % listPins.length;
    setFocusedStopKey(listPins[next].stop.key);
    listRef.current
      ?.querySelector(`[data-stop-key="${listPins[next].stop.key}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  };

  const isLoading = (networkQuery.isLoading && !networkQuery.data) || (linesQuery.isLoading && !linesQuery.data);
  if (isLoading) return <CenteredSpinner />;

  const points: MapPoint[] = listPins.flatMap((pin) => {
    const { latitude, longitude } = pin.stop;
    if (typeof latitude !== 'number' || typeof longitude !== 'number') return [];
    const isFocused = pin.stop.key === focusedStopKey;
    return [
      {
        id: pin.stop.key,
        lat: latitude,
        lng: longitude,
        // Focus colour matches mobile's network screen (FOCUS_COLOR), a darker
        // shade of the module's orange accent rather than an unrelated hue.
        color: isFocused ? '#c2410c' : `#${pin.lineColor.replace(/^#/, '')}`,
        radius: isFocused ? 11 : 6,
        popup: (
          <span className="text-xs">
            <strong>{pin.stop.name_pt}</strong>
            <br />
            {t('minibusNetworkOpenStop')}
          </span>
        ),
        onClick: () => activate(pin),
      },
    ];
  });

  return (
    <>
      <Seo modulePath="/minibus/network" />
      <BackLink to="/minibus" label={t('navBarMinibusLabel')} />
      <PageHeader title={t('minibusNetworkMap')} subtitle={tab === 'map' ? t('minibusNetworkTapStop') : undefined} />

      <div className="mb-4">
        <SegmentedControl
          value={tab}
          onChange={setTab}
          options={[
            { value: 'map', label: t('minibusMapTab') },
            { value: 'lines', label: t('minibusSectionLines') },
          ]}
        />
      </div>

      {tab === 'lines' ? (
        <div className="flex max-w-2xl flex-col gap-4">
          <MinibusDocumentImage
            documentSlug="network-map"
            alt={t('minibusNetworkMapImageAlt')}
            title={t('minibusNetworkMap')}
            tapHint={t('minibusNetworkMapTapToZoom')}
            fullscreenLabel={t('minibusNetworkMapOpenFullscreen')}
            closeLabel={t('close')}
          />
          {linesQuery.data ? (
            <div className="flex flex-col gap-3">
              {linesQuery.data.lines.map((line) => (
                <MinibusLineCard key={line.slug} line={line} />
              ))}
            </div>
          ) : null}
        </div>
      ) : (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-2">
          <div
            className="h-[30rem] overflow-hidden rounded-2xl border border-border"
            aria-label={t('minibusNetworkMapA11y')}
          >
            <MapView points={points} center={staticIslandMinibusCenter} zoom={14} />
          </div>

          {focused ? (
            <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2">
              <button
                type="button"
                aria-label={t('minibusNetworkPreviousStop')}
                onClick={() => step(-1)}
                className="rounded-lg p-1.5 text-muted hover:bg-surface-variant hover:text-content"
              >
                <ChevronLeft size={18} />
              </button>
              <button type="button" onClick={() => activate(focused)} className="min-w-0 flex-1 text-left">
                <span className="block truncate text-sm font-semibold text-content">{focused.stop.name_pt}</span>
                <span className="block text-xs text-muted">
                  {focusedIndex + 1}/{listPins.length} · {t('minibusNetworkOpenStop')}
                </span>
              </button>
              <button
                type="button"
                aria-label={t('minibusNetworkNextStop')}
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
            <Search size={16} className="pointer-events-none absolute left-6 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('minibusNetworkSearchPlaceholder')}
              className="h-10 w-full rounded-xl border border-border bg-surface pl-9 pr-3 text-sm text-content placeholder:text-muted focus:border-[#f47216] focus:outline-none"
            />
          </div>

          {listPins.length === 0 ? (
            <p className="p-4 text-sm text-muted">{t('minibusNetworkNoMatches')}</p>
          ) : (
            <ul ref={listRef} className="flex-1 divide-y divide-border overflow-auto">
              {listPins.map((pin) => (
                <li key={pin.stop.key} data-stop-key={pin.stop.key}>
                  <button
                    type="button"
                    onClick={() => activate(pin)}
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-surface-variant',
                      pin.stop.key === focusedStopKey && 'bg-surface-variant',
                    )}
                  >
                    <MapPin
                      size={14}
                      className={cn('shrink-0', pin.stop.key === focusedStopKey ? 'text-[#f47216]' : 'text-muted')}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm text-content">{pin.stop.name_pt}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      )}

      <MinibusNetworkStopDialog pin={openPin} onClose={() => setOpenPin(null)} />
    </>
  );
}
