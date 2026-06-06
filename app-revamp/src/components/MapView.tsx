import { MapContainer, TileLayer, CircleMarker, Polyline, Popup, useMap } from 'react-leaflet';
import type { LatLngBoundsExpression } from 'leaflet';
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

function collectBounds(points: MapPoint[], lines: MapLine[]): [number, number][] {
  const coords: [number, number][] = points.map((p) => [p.lat, p.lng]);
  for (const line of lines) {
    coords.push(...line.coords);
  }
  return coords;
}

/**
 * Leaflet only measures its container once on init. When the map mounts before
 * the page has settled (stacked cards, images loading, fonts), tiles render for
 * the wrong size and leave grey gaps. Re-measure on mount and on container resize.
 */
function AutoResize() {
  const map = useMap();
  useEffect(() => {
    const invalidate = () => map.invalidateSize();
    const timers = [setTimeout(invalidate, 0), setTimeout(invalidate, 200), setTimeout(invalidate, 600)];
    const observer = new ResizeObserver(() => invalidate());
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

function FitToContent({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length === 0) return;
    if (coords.length === 1) {
      map.setView(coords[0], 12);
      return;
    }
    const lats = coords.map((c) => c[0]);
    const lngs = coords.map((c) => c[1]);
    const bounds: LatLngBoundsExpression = [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)],
    ];
    map.fitBounds(bounds, { padding: [36, 36], maxZoom: 14 });
  }, [map, coords]);
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
      <AutoResize />
      {fit ? <FitToContent coords={boundsCoords} /> : null}
    </MapContainer>
  );
}
