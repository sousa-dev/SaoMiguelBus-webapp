import { MapContainer, TileLayer, CircleMarker, Polyline, Popup, useMap } from 'react-leaflet';
import type { LatLngBoundsExpression } from 'leaflet';
import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';

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

function collectBounds(points: MapPoint[], lines: MapLine[]): [number, number][] {
  const coords: [number, number][] = points.map((p) => [p.lat, p.lng]);
  for (const line of lines) {
    coords.push(...line.coords);
  }
  return coords;
}

/**
 * Leaflet measures its container only on init. When a map mounts before the page
 * has settled (stacked cards below the fold, images/fonts loading), tiles render
 * for the wrong size (grey gaps) AND fitBounds computes the wrong zoom (world
 * view). So we re-measure (invalidateSize) and re-fit whenever the container size
 * changes — on mount, after settle timers, and via a ResizeObserver.
 */
function AutoFit({ coords, fit }: { coords: [number, number][]; fit: boolean }) {
  const map = useMap();
  const fittedRef = useRef(false);
  const key = coords.map((c) => `${c[0].toFixed(5)},${c[1].toFixed(5)}`).join('|');

  useEffect(() => {
    // New content (route changed): allow exactly one fit again.
    fittedRef.current = false;
    const container = map.getContainer();

    // Fit once, only when the container actually has a size. This avoids the
    // world-zoom bug when a map mounts below the fold with a 0-height container.
    const tryFit = () => {
      map.invalidateSize();
      if (fittedRef.current || !fit || coords.length === 0) return;
      if (container.offsetWidth === 0 || container.offsetHeight === 0) return;
      if (coords.length === 1) {
        map.setView(coords[0], 13);
      } else {
        const lats = coords.map((c) => c[0]);
        const lngs = coords.map((c) => c[1]);
        const bounds: LatLngBoundsExpression = [
          [Math.min(...lats), Math.min(...lngs)],
          [Math.max(...lats), Math.max(...lngs)],
        ];
        map.fitBounds(bounds, { padding: [36, 36], maxZoom: 14 });
      }
      fittedRef.current = true;
    };

    tryFit();
    const timers = [setTimeout(tryFit, 100), setTimeout(tryFit, 400), setTimeout(tryFit, 900)];
    // Observe size changes: re-measure tiles, and fit once the container is sized.
    const observer = new ResizeObserver(() => tryFit());
    observer.observe(container);
    const onWinResize = () => map.invalidateSize();
    window.addEventListener('resize', onWinResize);
    return () => {
      timers.forEach(clearTimeout);
      observer.disconnect();
      window.removeEventListener('resize', onWinResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key, fit]);
  return null;
}

export function MapView({
  points = [],
  lines = [],
  center = staticIslandConfig.mapCenter,
  zoom = 10,
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
  const boundsCoords = collectBounds(points, lines);

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      className={className}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={interactive}
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
      <AutoFit coords={boundsCoords} fit={fit} />
    </MapContainer>
  );
}
