import L from 'leaflet';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet';

import { staticIslandConfig } from '@/config/island';
import { viewForCoords } from '@/components/map/view-for-coords';

export interface LiveMapVehicle {
  id: string;
  position: { lat: number; lon: number };
  /** Line code shown on the marker; null while the route index is warming. */
  lineCode: string | null;
  color: string;
}

type Props = {
  vehicles: LiveMapVehicle[];
  selectedVehicleId?: string | null;
  /** Vehicle id to fly to once (deep link or a fresh selection). */
  focusVehicleId?: string | null;
  routePolyline?: [number, number][];
  routeColor?: string | null;
  onSelectVehicle: (vehicleId: string) => void;
  className?: string;
  /** Shown when the fleet is empty. Defaults to the island-wide view (AzoresBus is island-wide). */
  fallbackCenter?: { lat: number; lng: number };
  fallbackZoom?: number;
};

function busIcon(vehicle: LiveMapVehicle, selected: boolean) {
  const label = vehicle.lineCode ?? '?';
  return L.divIcon({
    className: 'live-bus-icon',
    html: `<span class="live-bus${selected ? ' live-bus--selected' : ''}" style="--bus:${vehicle.color}">${label}</span>`,
    iconSize: [40, 22],
    iconAnchor: [20, 11],
  });
}

/** Leaflet measures its container once; keep it honest across layout settles and resizes. */
function KeepSized() {
  const map = useMap();
  useEffect(() => {
    map.scrollWheelZoom.disable();
    const invalidate = () => map.invalidateSize();
    invalidate();
    const timers = [setTimeout(invalidate, 100), setTimeout(invalidate, 400)];
    const observer = new ResizeObserver(invalidate);
    observer.observe(map.getContainer());
    return () => {
      timers.forEach(clearTimeout);
      observer.disconnect();
    };
  }, [map]);
  return null;
}

function FocusOn({ vehicle }: { vehicle: LiveMapVehicle | null }) {
  const map = useMap();
  useEffect(() => {
    if (vehicle) map.flyTo([vehicle.position.lat, vehicle.position.lon], Math.max(map.getZoom(), 13));
  }, [map, vehicle]);
  return null;
}

/**
 * The initial `center`/`zoom` react-leaflet is given only ever apply to the very first paint,
 * which usually happens before the fleet has loaded. Once real vehicle positions arrive, fit the
 * view to them — but only the first time, so a later poll never yanks the map from under a rider
 * who has since panned around.
 */
function FitToFleetOnce({
  vehicles,
  fallbackCenter,
  fallbackZoom,
}: {
  vehicles: LiveMapVehicle[];
  fallbackCenter: { lat: number; lng: number };
  fallbackZoom: number;
}) {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (fitted.current || vehicles.length === 0) return;
    fitted.current = true;
    const view = viewForCoords(
      vehicles.map((v) => [v.position.lat, v.position.lon] as [number, number]),
      fallbackCenter,
      fallbackZoom,
    );
    map.setView(view.center, view.zoom);
  }, [fallbackCenter, fallbackZoom, map, vehicles]);
  return null;
}

/**
 * The live fleet on OpenStreetMap tiles. The initial view is fitted once, to the first
 * non-empty fleet, so a later poll never yanks the map away from where the rider panned.
 */
export function LiveVehicleMap({
  vehicles,
  selectedVehicleId = null,
  focusVehicleId = null,
  routePolyline,
  routeColor,
  onSelectVehicle,
  className,
  fallbackCenter = staticIslandConfig.mapCenter,
  fallbackZoom = 10,
}: Props) {
  const [initialView] = useState(() =>
    viewForCoords(
      vehicles.map((v) => [v.position.lat, v.position.lon] as [number, number]),
      fallbackCenter,
      fallbackZoom,
    ),
  );
  const focused = useMemo(
    () => vehicles.find((v) => v.id === focusVehicleId) ?? null,
    [focusVehicleId, vehicles],
  );

  return (
    <MapContainer
      center={initialView.center}
      zoom={initialView.zoom}
      className={className}
      style={{ height: '100%', width: '100%', position: 'relative', zIndex: 0 }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      {routePolyline && routePolyline.length > 1 ? (
        <Polyline positions={routePolyline} pathOptions={{ color: routeColor ?? '#1e88e5', weight: 5, opacity: 0.8 }} />
      ) : null}
      {vehicles.map((vehicle) => (
        <Marker
          key={vehicle.id}
          position={[vehicle.position.lat, vehicle.position.lon]}
          icon={busIcon(vehicle, vehicle.id === selectedVehicleId)}
          eventHandlers={{ click: () => onSelectVehicle(vehicle.id) }}
          zIndexOffset={vehicle.id === selectedVehicleId ? 1000 : 0}
        />
      ))}
      <FocusOn vehicle={focused} />
      <FitToFleetOnce vehicles={vehicles} fallbackCenter={fallbackCenter} fallbackZoom={fallbackZoom} />
      <KeepSized />
    </MapContainer>
  );
}
