// Ported from the tracking slice of SaoMiguelBus/lib/profile-store.ts. No OS alarms on the web,
// so the notification bookkeeping is gone; everything else (identity, caps, pruning) is verbatim.
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { staticIslandConfig } from '@/config/island';
import { liftTrackedRecord } from '@/features/transit/tracking/bus-tracking';
import type {
  ActiveTrack,
  PinResult,
  PinnedRoute,
  TrackedLeg,
  TrackingState,
} from '@/features/transit/tracking/tracking-types';
import { track } from '@/lib/analytics';
import { webStorage } from '@/lib/persist-storage';
import type { TransitDataset } from '@/lib/types';

export const MAX_ACTIVE_TRACKS = 5;
const ACTIVE_TRACK_TTL_MS = 4 * 60 * 60 * 1000;
/** Each pin carries every stop of every leg, so the list is bounded. */
export const MAX_PINNED_ROUTES = 20;

export function trackingStorageKey(): string {
  return `smb_tracking_${staticIslandConfig.islandKey}`;
}

function pairKey(origin: string, destination: string) {
  return `${origin.trim().toLowerCase()}|${destination.trim().toLowerCase()}`;
}

function newTrackId() {
  return `track_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Identity of a pinned/tracked ITINERARY: the trip ids of every leg (or the route sequence once
 * the cutover migration has dropped them) plus the endpoints. Two itineraries sharing a first bus
 * are still different itineraries.
 */
function itineraryKey(entry: {
  journeyId?: string;
  legs?: TrackedLeg[];
  tripId?: number;
  routeNumber?: string;
  origin: string;
  destination: string;
}) {
  const tripIds = (entry.legs ?? []).map((l) => l.tripId).filter((id) => id != null);
  const shape = tripIds.length ? tripIds.join(':') : (entry.routeNumber ?? String(entry.tripId ?? ''));
  return `${entry.journeyId ?? shape}|${pairKey(entry.origin, entry.destination)}`;
}

interface TrackingStore extends TrackingState {
  startTracking: (
    input: Omit<ActiveTrack, 'id' | 'createdAt' | 'expiresAt'> & { expiresAt?: number },
  ) => boolean;
  stopTracking: (trackId: string) => void;
  pinRoute: (input: Omit<PinnedRoute, 'id' | 'pinnedAt'>) => PinResult;
  unpinRoute: (pinId: string) => void;
  /** Drops expired tracks and, when `dataset` is supplied, tracks built against another network. */
  pruneTracking: (now?: number, dataset?: TransitDataset | null) => void;
  /** Record that the sweep armed this pin today; other days' entries are discarded. */
  markAutoTracked: (pinId: string, day: string) => void;
  resetAll: () => void;
}

const defaultState = (): TrackingState => ({ active: [], pinned: [], lastCleanup: Date.now() });

export const useTrackingStore = create<TrackingStore>()(
  persist(
    (set, get) => ({
      ...defaultState(),

      startTracking: (input) => {
        get().pruneTracking();
        const { active } = get();
        const key = itineraryKey(input);
        if (active.some((t) => itineraryKey(t) === key && t.searchDay === input.searchDay)) {
          return false;
        }
        if (active.length >= MAX_ACTIVE_TRACKS) {
          return false;
        }
        const now = Date.now();
        const entry: ActiveTrack = {
          ...input,
          id: newTrackId(),
          createdAt: now,
          // The caller derives the expiry from the itinerary; this is only the fallback.
          expiresAt: input.expiresAt ?? now + ACTIVE_TRACK_TTL_MS,
        };
        set({ active: [...active, entry] });
        track('transit', 'track_start', { trip_id: input.tripId, route: input.routeNumber });
        return true;
      },

      stopTracking: (trackId) => {
        set({ active: get().active.filter((t) => t.id !== trackId) });
        track('transit', 'track_stop', { track_id: trackId });
      },

      pinRoute: (input) => {
        const { pinned } = get();
        const key = itineraryKey(input);
        if (pinned.some((p) => itineraryKey(p) === key)) {
          return 'duplicate';
        }
        if (pinned.length >= MAX_PINNED_ROUTES) {
          return 'cap';
        }
        const pin: PinnedRoute = { ...input, id: newTrackId(), pinnedAt: Date.now() };
        set({ pinned: [...pinned, pin] });
        track('transit', 'track_pin', { trip_id: input.tripId, route: input.routeNumber });
        return 'ok';
      },

      unpinRoute: (pinId) => {
        set({ pinned: get().pinned.filter((p) => p.id !== pinId) });
        track('transit', 'track_stop', { track_id: pinId, kind: 'pin' });
      },

      pruneTracking: (now = Date.now(), dataset) => {
        const { active } = get();
        // Only an EXPLICIT, mismatched stamp drops a track: a null dataset means it has not
        // resolved yet, and an unstamped track predates it; both age out on their own.
        const kept = active.filter(
          (t) =>
            t.expiresAt > now && !(dataset != null && t.dataset != null && t.dataset !== dataset),
        );
        if (kept.length !== active.length) {
          set({ active: kept, lastCleanup: now });
        }
      },

      markAutoTracked: (pinId, day) => {
        const suffix = `|${day}`;
        const kept = Object.entries(get().autoTracked ?? {}).filter(([key]) => key.endsWith(suffix));
        set({ autoTracked: { ...Object.fromEntries(kept), [`${pinId}${suffix}`]: Date.now() } });
      },

      resetAll: () => set({ ...defaultState(), autoTracked: undefined }),
    }),
    {
      name: trackingStorageKey(),
      storage: createJSONStorage(webStorage),
      version: 1,
      partialize: (state) => ({
        active: state.active,
        pinned: state.pinned,
        lastCleanup: state.lastCleanup,
        autoTracked: state.autoTracked,
      }),
      migrate: (persisted) => {
        const state = persisted as TrackingState;
        return {
          ...state,
          active: (state.active ?? []).map(liftTrackedRecord),
          pinned: (state.pinned ?? []).map(liftTrackedRecord),
        };
      },
    },
  ),
);
