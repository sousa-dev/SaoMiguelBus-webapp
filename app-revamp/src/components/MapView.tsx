import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
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

function FitToPoints({ points }: { points: MapPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 12);
      return;
    }
    const lats = points.map((p) => p.lat);
    const lngs = points.map((p) => p.lng);
    map.fitBounds(
      [
        [Math.min(...lats), Math.min(...lngs)],
        [Math.max(...lats), Math.max(...lngs)],
      ],
      { padding: [40, 40], maxZoom: 13 },
    );
  }, [map, points]);
  return null;
}

export function MapView({
  points,
  center = staticIslandConfig.mapCenter,
  zoom = 10,
  className,
  fit = true,
}: {
  points: MapPoint[];
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
  fit?: boolean;
}) {
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      scrollWheelZoom
      className={className}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
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
      {fit ? <FitToPoints points={points} /> : null}
    </MapContainer>
  );
}
