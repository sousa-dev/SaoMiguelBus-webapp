import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface RecentSearch {
  origin: string;
  destination: string;
  day: string;
  time: string;
}

interface ProfileState {
  recentSearches: RecentSearch[];
  favoriteRoutes: { origin: string; destination: string }[];
  addRecentSearch: (search: RecentSearch) => void;
  clearRecentSearches: () => void;
  toggleFavoriteRoute: (origin: string, destination: string) => void;
  isFavoriteRoute: (origin: string, destination: string) => boolean;
}

const MAX_RECENT = 6;

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      recentSearches: [],
      favoriteRoutes: [],
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
    }),
    { name: 'smb_profile' },
  ),
);
