// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/analytics', () => ({ track: vi.fn() }));

import {
  MAX_ACTIVE_TRACKS,
  MAX_PINNED_ROUTES,
  trackingStorageKey,
  useTrackingStore,
} from '@/features/transit/tracking/tracking-store';
import type { ActiveTrack, PinnedRoute } from '@/features/transit/tracking/tracking-types';

const NOW = new Date('2026-09-06T08:00:00.000Z').getTime();

function trackInput(overrides: Partial<ActiveTrack> = {}): Omit<ActiveTrack, 'id' | 'createdAt' | 'expiresAt'> & {
  expiresAt?: number;
} {
  return {
    routeNumber: '110',
    origin: 'Ponta Delgada',
    destination: 'Ribeira Grande',
    searchDay: 'weekday',
    searchDate: '2026-09-06',
    journeyId: 'j1',
    dataset: 'azoresbus',
    legs: [{ tripId: 1, routeNumber: '110', origin: 'Ponta Delgada', destination: 'Ribeira Grande', start: '09h00', end: '09h45', stops: [] }],
    transfers: [],
    nextDeparture: '09h00',
    estimatedArrival: '09h45',
    ...overrides,
  };
}

function pinInput(overrides: Partial<PinnedRoute> = {}): Omit<PinnedRoute, 'id' | 'pinnedAt'> {
  const { journeyId, dataset, legs, transfers, routeNumber, origin, destination, searchDay } = trackInput();
  return { journeyId, dataset, legs, transfers, routeNumber, origin, destination, searchDay, ...overrides };
}

beforeEach(() => {
  localStorage.clear();
  useTrackingStore.getState().resetAll();
  vi.setSystemTime(NOW);
});

describe('tracking store', () => {
  it('persists under the island-scoped web key', () => {
    expect(trackingStorageKey()).toMatch(/^smb_tracking_/);
    useTrackingStore.getState().startTracking(trackInput());
    const raw = JSON.parse(localStorage.getItem(trackingStorageKey())!);
    expect(raw.state.active).toHaveLength(1);
    expect(raw.version).toBe(1);
  });

  it('starts a track with a generated id and a fallback expiry, refusing the same itinerary twice', () => {
    const store = useTrackingStore.getState();
    expect(store.startTracking(trackInput())).toBe(true);
    expect(store.startTracking(trackInput())).toBe(false);
    const [track] = useTrackingStore.getState().active;
    expect(track.id).toMatch(/^track_/);
    expect(track.expiresAt).toBe(NOW + 4 * 60 * 60 * 1000);
    expect(useTrackingStore.getState().active).toHaveLength(1);
  });

  it('caps active tracks', () => {
    const store = useTrackingStore.getState();
    for (let i = 0; i < MAX_ACTIVE_TRACKS; i++) {
      expect(store.startTracking(trackInput({ journeyId: `j${i}`, legs: [{ ...trackInput().legs[0], tripId: i + 1 }] }))).toBe(true);
    }
    expect(store.startTracking(trackInput({ journeyId: 'overflow', legs: [{ ...trackInput().legs[0], tripId: 99 }] }))).toBe(false);
    expect(useTrackingStore.getState().active).toHaveLength(MAX_ACTIVE_TRACKS);
  });

  it('stops a track by id', () => {
    const store = useTrackingStore.getState();
    store.startTracking(trackInput());
    const id = useTrackingStore.getState().active[0].id;
    store.stopTracking(id);
    expect(useTrackingStore.getState().active).toHaveLength(0);
  });

  it('pins with duplicate and cap outcomes', () => {
    const store = useTrackingStore.getState();
    expect(store.pinRoute(pinInput())).toBe('ok');
    expect(store.pinRoute(pinInput())).toBe('duplicate');
    for (let i = 1; i < MAX_PINNED_ROUTES; i++) {
      expect(store.pinRoute(pinInput({ journeyId: `extra${i}` }))).toBe('ok');
    }
    expect(store.pinRoute(pinInput({ journeyId: 'overflow' }))).toBe('cap');
    const id = useTrackingStore.getState().pinned[0].id;
    store.unpinRoute(id);
    expect(useTrackingStore.getState().pinned).toHaveLength(MAX_PINNED_ROUTES - 1);
  });

  it('prunes expired tracks and tracks from another dataset, but not unstamped ones', () => {
    const store = useTrackingStore.getState();
    store.startTracking(trackInput({ journeyId: 'expired', expiresAt: NOW - 1 }));
    store.startTracking(trackInput({ journeyId: 'legacy', dataset: 'legacy', legs: [{ ...trackInput().legs[0], tripId: 2 }] }));
    store.startTracking(trackInput({ journeyId: 'unstamped', dataset: undefined, legs: [{ ...trackInput().legs[0], tripId: 3 }] }));
    store.startTracking(trackInput({ journeyId: 'keep', legs: [{ ...trackInput().legs[0], tripId: 4 }] }));
    store.pruneTracking(NOW, 'azoresbus');
    expect(useTrackingStore.getState().active.map((t) => t.journeyId)).toEqual(['unstamped', 'keep']);
    store.pruneTracking(NOW, null);
    expect(useTrackingStore.getState().active).toHaveLength(2);
  });

  it('remembers auto-tracked pins for today only', () => {
    const store = useTrackingStore.getState();
    store.markAutoTracked('pin1', '2026-09-05');
    store.markAutoTracked('pin2', '2026-09-06');
    expect(Object.keys(useTrackingStore.getState().autoTracked ?? {})).toEqual(['pin2|2026-09-06']);
  });
});
