import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { webStorage } from '@/lib/persist-storage';
import type { AuthUser } from '@/lib/types';

const AUTH_KEY = 'azores_hub_auth';

interface AuthState {
  /** Opaque DRF token. The web has no secure store, so it persists next to the profile. */
  token: string | null;
  user: AuthUser | null;
  /** True once persisted state has been read (synchronous for localStorage). */
  hydrated: boolean;
  setSession: (token: string, user: AuthUser) => void;
  setUser: (user: AuthUser) => void;
  clearSession: () => void;
  /** Re-read the profile from `/auth/me`. Keeps the session on transient failures, drops it on 401. */
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      hydrated: false,
      setSession: (token, user) => set({ token, user }),
      setUser: (user) => set({ user }),
      clearSession: () => set({ token: null, user: null }),
      refreshUser: async () => {
        if (!get().token) return;
        try {
          // Dynamic so `lib/api` can import this store statically without a cycle.
          const { fetchMe } = await import('@/lib/api');
          const user = await fetchMe();
          set({ user });
        } catch (error) {
          const { ApiRequestError } = await import('@/lib/api-errors');
          if (error instanceof ApiRequestError && error.status === 401) {
            set({ token: null, user: null });
          }
        }
      },
    }),
    {
      name: AUTH_KEY,
      storage: createJSONStorage(webStorage),
      partialize: (state) => ({ token: state.token, user: state.user }),
      onRehydrateStorage: () => () => {
        useAuthStore.setState({ hydrated: true });
      },
    },
  ),
);

export function getAuthToken(): string | null {
  return useAuthStore.getState().token;
}

export function isSignedIn(): boolean {
  return Boolean(useAuthStore.getState().token);
}
