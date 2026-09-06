import { useEffect } from 'react';

import { useAuthStore } from '@/features/account/auth-store';

/**
 * Refresh the persisted profile from `/auth/me` once per page load. A stale or revoked token
 * clears the session here rather than on the first authenticated call the user makes.
 */
export function useAuthBootstrap(): void {
  useEffect(() => {
    void useAuthStore.getState().refreshUser();
  }, []);
}
