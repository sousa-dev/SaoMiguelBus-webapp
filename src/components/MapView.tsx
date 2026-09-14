import L from 'leaflet';
import { MapContainer, TileLayer, CircleMarker, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { staticIslandConfig } from '@/config/island';

// Lucide's "locate-fixed" glyph, inlined: a Leaflet control is plain DOM, not
// React, so this avoids mounting a second React root just for one icon.
const LOCATE_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="2" x2="5" y1="12" y2="12"/><line x1="19" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="5"/><line x1="12" x2="12" y1="19" y2="22"/><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3"/></svg>`;

export interface MapPoint {
  id: string | number;
  lat: number;
  lng: number;
  color?: string;
  radius?: number;
  popup?: ReactNode;
  onClick?: () => void;
}

export interface MapLine {
  id: string | number;
  coords: [number, number][];
  color?: string;
  weight?: number;
}

function collectCoords(points: MapPoint[], lines: MapLine[]): [number, number][] {
  const coords: [number, number][] = points.map((p) => [p.lat, p.lng]);
  for (const line of lines) {
    coords.push(...line.coords);
  }
  return coords;
}

/**
 * Deterministically derive a center + zoom from a bounding box, WITHOUT relying on
 * the container size. This avoids Leaflet's flaky fitBounds behaviour when a map
 * mounts below the fold / is scrolled (which caused world-zoom + tile gaps).
 */
function viewForCoords(
  coords: [number, number][],
  fallback: { lat: number; lng: number },
  fallbackZoom: number,
): { center: [number, number]; zoom: number } {
  if (coords.length === 0) {
    return { center: [fallback.lat, fallback.lng], zoom: fallbackZoom };
  }
  const lats = coords.map((c) => c[0]);
  const lngs = coords.map((c) => c[1]);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const center: [number, number] = [(minLat + maxLat) / 2, (minLng + maxLng) / 2];
  if (coords.length === 1) {
    return { center, zoom: 13 };
  }
  const span = Math.max(maxLat - minLat, (maxLng - minLng) * Math.cos((center[0] * Math.PI) / 180));
  const zoom = span > 0.6 ? 9 : span > 0.3 ? 10 : span > 0.15 ? 11 : span > 0.07 ? 12 : span > 0.03 ? 13 : 14;
  return { center, zoom };
}

/**
 * Leaflet measures its container once on init; if that happens before layout
 * settles, tiles render for the wrong size and leave grey gaps. Re-measure on
 * mount, after a couple of settle ticks, and whenever the container resizes.
 * (View/zoom is fixed up front, so this never changes what the map shows.)
 */
function KeepSized() {
  const map = useMap();
  useEffect(() => {
    // Guarantee page scroll never zooms the map (props are init-only in react-leaflet).
    map.scrollWheelZoom.disable();
    const invalidate = () => map.invalidateSize();
    invalidate();
    const timers = [setTimeout(invalidate, 100), setTimeout(invalidate, 400), setTimeout(invalidate, 900)];
    const observer = new ResizeObserver(invalidate);
    observer.observe(map.getContainer());
    window.addEventListener('resize', invalidate);
    return () => {
      timers.forEach(clearTimeout);
      observer.disconnect();
      window.removeEventListener('resize', invalidate);
    };
  }, [map]);
  return null;
}

/** Pans/zooms to `target` whenever it changes — the imperative escape hatch react-leaflet's declarative `center`/`zoom` (init-only) doesn't offer. */
function FocusOn({ target }: { target: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), 15));
  }, [map, target]);
  return null;
}

const userLocationIcon = L.divIcon({
  className: 'user-location-icon',
  html: '<span class="user-location-dot"></span>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

/**
 * A Leaflet control (not a React tree — Leaflet controls are plain DOM) that
 * either recentres on a known fix or asks the caller to get one, mirroring
 * the mobile app's locate button: silent while a fix is already flowing in,
 * a single click away from asking for one otherwise.
 */
function LocateControl({
  userLocation,
  onRequestLocation,
  label,
}: {
  userLocation: { lat: number; lng: number } | null;
  onRequestLocation?: () => void;
  label: string;
}) {
  const map = useMap();
  // The control's click handler reads this ref rather than closing over the
  // props directly, so the control is created once (not re-added, which
  // would flash it) while still seeing the latest fix / callback.
  const latestRef = useRef({ userLocation, onRequestLocation });
  latestRef.current = { userLocation, onRequestLocation };

  useEffect(() => {
    const control = new L.Control({ position: 'topleft' });
    control.onAdd = () => {
      const container = L.DomUtil.create('div', 'leaflet-bar locate-control');
      const link = L.DomUtil.create('a', '', container) as HTMLAnchorElement;
      link.href = '#';
      link.title = label;
      link.setAttribute('aria-label', label);
      link.innerHTML = LOCATE_ICON_SVG;
      L.DomEvent.on(link, 'click', L.DomEvent.stop).on(link, 'click', () => {
        const { userLocation: current, onRequestLocation: request } = latestRef.current;
        if (current) {
          map.flyTo([current.lat, current.lng], Math.max(map.getZoom(), 15));
        } else {
          request?.();
        }
      });
      return container;
    };
    control.addTo(map);
    return () => {
      control.remove();
    };
  }, [map, label]);

  return null;
}

export function MapView({
  points = [],
  lines = [],
  center,
  zoom,
  className,
  fit = true,
  interactive = true,
  focus = null,
  userLocation = null,
  onRequestLocation,
  showLocateControl = false,
  showZoomControl = true,
  extraFitCoords = [],
}: {
  points?: MapPoint[];
  lines?: MapLine[];
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
  fit?: boolean;
  /** When false, renders a static (non-pannable) preview map — used for hub cards. */
  interactive?: boolean;
  /** Pan/zoom to this point on change (e.g. a selected journey step) — leave null for a static fit. */
  focus?: { lat: number; lng: number } | null;
  /** The viewer's own position, when known — draws the blue dot. */
  userLocation?: { lat: number; lng: number } | null;
  /** No fix yet: clicking the (still-shown) locate control asks the caller for one. */
  onRequestLocation?: () => void;
  showLocateControl?: boolean;
  /** Off for a small preview map, where zooming is not the point. */
  showZoomControl?: boolean;
  /**
   * Extra points folded into the auto-fit bounds without being drawn — the
   * user's dot, only when it is close enough to the route to be worth
   * framing alongside it.
   */
  extraFitCoords?: [number, number][];
}) {
  const { t } = useTranslation();
  const fallbackCenter = center ?? staticIslandConfig.mapCenter;
  const fallbackZoom = zoom ?? 10;
  const view = fit
    ? viewForCoords([...collectCoords(points, lines), ...extraFitCoords], fallbackCenter, fallbackZoom)
    : { center: [fallbackCenter.lat, fallbackCenter.lng] as [number, number], zoom: fallbackZoom };

  return (
    <MapContainer
      center={view.center}
      zoom={view.zoom}
      className={className}
      style={{ height: '100%', width: '100%', position: 'relative', zIndex: 0 }}
      /* Never hijack page scroll — users zoom with the +/- control or double-click. */
      scrollWheelZoom={false}
      dragging={interactive}
      doubleClickZoom={interactive}
      zoomControl={interactive && showZoomControl}
      attributionControl={interactive}
      keyboard={interactive}
      touchZoom={interactive}
      boxZoom={interactive}
    >
      {/* OpenStreetMap raster tiles — same basemap the mobile app uses. */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      {lines.map((line) => (
        <Polyline
          key={line.id}
          positions={line.coords}
          pathOptions={{ color: line.color ?? '#1e88e5', weight: line.weight ?? 5, opacity: 0.9 }}
        />
      ))}
      {points.map((p) => (
        <CircleMarker
          key={p.id}
          center={[p.lat, p.lng]}
          radius={p.radius ?? 9}
          pathOptions={{
            color: '#ffffff',
            weight: 2,
            fillColor: p.color ?? '#218732',
            fillOpacity: 0.9,
          }}
          eventHandlers={p.onClick ? { click: p.onClick } : undefined}
        >
          {p.popup ? <Popup>{p.popup}</Popup> : null}
        </CircleMarker>
      ))}
      {userLocation ? (
        <Marker
          position={[userLocation.lat, userLocation.lng]}
          icon={userLocationIcon}
          interactive={false}
          keyboard={false}
        />
      ) : null}
      {showLocateControl && interactive ? (
        <LocateControl
          userLocation={userLocation}
          onRequestLocation={onRequestLocation}
          label={t('mapCenterOnLocation')}
        />
      ) : null}
      <FocusOn target={focus} />
      <KeepSized />
    </MapContainer>
  );
}
