import { MapContainer, TileLayer, CircleMarker, Polyline, Popup, useMap } from 'react-leaflet';
import type { ReactNode } from 'react';
import { useEffect } from 'react';

import { staticIslandConfig } from '@/config/island';

export interface MapPoint {
  id: string | number;
  lat: number;
  lng: number;
  color?: string;
  radius?: number;
  popup?: ReactNode;
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

export function MapView({
  points = [],
  lines = [],
  center,
  zoom,
  className,
  fit = true,
  interactive = true,
}: {
  points?: MapPoint[];
  lines?: MapLine[];
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
  fit?: boolean;
  /** When false, renders a static (non-pannable) preview map — used for hub cards. */
  interactive?: boolean;
}) {
  const fallbackCenter = center ?? staticIslandConfig.mapCenter;
  const fallbackZoom = zoom ?? 10;
  const view = fit
    ? viewForCoords(collectCoords(points, lines), fallbackCenter, fallbackZoom)
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
      zoomControl={interactive}
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
        >
          {p.popup ? <Popup>{p.popup}</Popup> : null}
        </CircleMarker>
      ))}
      <KeepSized />
    </MapContainer>
  );
}
