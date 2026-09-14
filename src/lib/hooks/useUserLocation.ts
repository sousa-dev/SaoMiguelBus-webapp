import { useCallback, useEffect, useRef, useState } from 'react';

export type LocationPermission = 'granted' | 'denied' | 'undetermined';

export interface UserLocation {
  coords: { lat: number; lng: number } | null;
  permission: LocationPermission;
  /** Ask for permission (first click of a locate control), then start watching. */
  request: () => void;
}

/**
 * Browser geolocation, silent unless permission is already granted.
 *
 * The Permissions API tells us whether geolocation was already granted
 * without prompting; if so we start watching immediately. Otherwise nothing
 * is requested until `request()` runs — a click on the locate control — which
 * is what actually triggers the browser's permission prompt.
 */
export function useUserLocation(): UserLocation {
  const [enabled, setEnabled] = useState(false);
  const [permission, setPermission] = useState<LocationPermission>('undetermined');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const nav = typeof navigator !== 'undefined' ? navigator : undefined;
    if (!nav?.permissions?.query) {
      return;
    }
    nav.permissions
      .query({ name: 'geolocation' as PermissionName })
      .then((status) => {
        if (cancelled) return;
        if (status.state === 'granted') {
          setEnabled(true);
        }
      })
      .catch(() => {
        // Permissions API not supported for geolocation in this browser —
        // stay off until the rider explicitly asks.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const geo = typeof navigator !== 'undefined' ? navigator.geolocation : undefined;
    if (!geo?.watchPosition) {
      setPermission('denied');
      return;
    }
    // Seed from whatever the browser already has. `watchPosition` reports on a
    // NEW fix, so a viewer sitting still can wait a long time for its first
    // callback — and the walking distances have nothing to show until then.
    // A generously cached fix fills that gap; the watcher replaces it.
    geo.getCurrentPosition(
      (pos) => {
        setPermission('granted');
        setCoords((current) =>
          current ?? { lat: pos.coords.latitude, lng: pos.coords.longitude },
        );
      },
      () => {
        // The watcher below reports the real failure; nothing to do here.
      },
      { enableHighAccuracy: false, maximumAge: 5 * 60 * 1000, timeout: 10000 },
    );

    const id = geo.watchPosition(
      (pos) => {
        setPermission('granted');
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => setPermission('denied'),
      { enableHighAccuracy: false, maximumAge: 10000 },
    );
    watchIdRef.current = id;
    return () => {
      geo.clearWatch(id);
      watchIdRef.current = null;
    };
  }, [enabled]);

  const request = useCallback(() => setEnabled(true), []);

  return { coords, permission, request };
}
