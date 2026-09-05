import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { TransitDataset } from '@/lib/types';

export interface RecentSearch {
  origin: string;
  destination: string;
  day: string;
  time: string;
  /** Which network produced it — a search is meaningless on the other one. */
  dataset?: TransitDataset | null;
}

export interface FavoriteStop {
  id: number;
  name: string;
}

interface ProfileState {
  recentSearches: RecentSearch[];
  favoriteRoutes: { origin: string; destination: string }[];
  favoriteStops: FavoriteStop[];
  /** The preview toggle. Non-null ⇒ the rider is looking at the new network. */
  transitPreviewDataset: TransitDataset | null;
  /** Session-scoped: see `partialize` below. */
  dismissedScheduleBannerId: string | null;
  addRecentSearch: (search: RecentSearch) => void;
  clearRecentSearches: () => void;
  toggleFavoriteRoute: (origin: string, destination: string) => void;
  isFavoriteRoute: (origin: string, destination: string) => boolean;
  toggleFavoriteStop: (stop: FavoriteStop) => void;
  isFavoriteStop: (name: string) => boolean;
  setTransitPreviewDataset: (dataset: TransitDataset | null) => void;
  dismissScheduleBanner: (id: string) => void;
}

const MAX_RECENT = 6;

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      recentSearches: [],
      favoriteRoutes: [],
      favoriteStops: [],
      transitPreviewDataset: null,
      dismissedScheduleBannerId: null,
      addRecentSearch: (search) =>
        set((state) => {
          const deduped = state.recentSearches.filter(
            (s) => !(s.origin === search.origin && s.destination === search.destination),
          );
          return { recentSearches: [search, ...deduped].slice(0, MAX_RECENT) };
        }),
      clearRecentSearches: () => set({ recentSearches: [] }),
      toggleFavoriteRoute: (origin, destination) =>
        set((state) => {
          const exists = state.favoriteRoutes.some(
            (r) => r.origin === origin && r.destination === destination,
          );
          return {
            favoriteRoutes: exists
              ? state.favoriteRoutes.filter(
                  (r) => !(r.origin === origin && r.destination === destination),
                )
              : [{ origin, destination }, ...state.favoriteRoutes],
          };
        }),
      isFavoriteRoute: (origin, destination) =>
        get().favoriteRoutes.some((r) => r.origin === origin && r.destination === destination),
      // Keyed on name, not id: the stops endpoint reuses one id across a stop and
      // its short-name aliases, so an id is not a stable identity here.
      toggleFavoriteStop: (stop) =>
        set((state) => {
          const exists = state.favoriteStops.some((s) => s.name === stop.name);
          return {
            favoriteStops: exists
              ? state.favoriteStops.filter((s) => s.name !== stop.name)
              : [stop, ...state.favoriteStops],
          };
        }),
      isFavoriteStop: (name) => get().favoriteStops.some((s) => s.name === name),
      setTransitPreviewDataset: (dataset) => set({ transitPreviewDataset: dataset }),
      dismissScheduleBanner: (id) => set({ dismissedScheduleBannerId: id }),
    }),
    {
      name: 'smb_profile',
      /**
       * `dismissedScheduleBannerId` is deliberately NOT persisted.
       *
       * The changeover banner is also the only way back to the preview toggle.
       * Dismissing it should quiet this visit, not remove the affordance for
       * good — so a fresh session re-offers it.
       */
      partialize: (state) => ({
        recentSearches: state.recentSearches,
        favoriteRoutes: state.favoriteRoutes,
        favoriteStops: state.favoriteStops,
        transitPreviewDataset: state.transitPreviewDataset,
      }),
    },
  ),
);
