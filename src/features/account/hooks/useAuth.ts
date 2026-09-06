import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/features/account/auth-store';
import { useEntitlementStore } from '@/features/premium/entitlement-store';
import { closeRevenueCat } from '@/features/premium/lib/revenuecat-web';
import { deleteAccount, loginAccount, logoutAccount, registerAccount } from '@/lib/api';
import type { AuthResponse } from '@/lib/types';

const ENTITLEMENT_KEY = ['billing', 'entitlement'] as const;

/** Account auth actions + reactive session state (mirrors the Expo hook, minus social). */
export function useAuth() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const onSession = async (res: AuthResponse) => {
    useAuthStore.getState().setSession(res.token, res.user);
    // Always reconcile profile flags (isSuperuser) from /auth/me — the login payload can be stale.
    await useAuthStore.getState().refreshUser();
    await queryClient.invalidateQueries({ queryKey: ENTITLEMENT_KEY });
  };

  const register = useMutation({ mutationFn: registerAccount, onSuccess: onSession });
  const login = useMutation({ mutationFn: loginAccount, onSuccess: onSession });

  const logout = useMutation({
    mutationFn: async () => {
      try {
        await logoutAccount();
      } finally {
        // Always drop the local session even if the server call fails.
        useAuthStore.getState().clearSession();
      }
    },
    onSettled: async () => {
      // On the web the RevenueCat identity is user-bound, so there is no anonymous premium to keep.
      useEntitlementStore.getState().clearEntitlement();
      closeRevenueCat();
      await queryClient.invalidateQueries({ queryKey: ENTITLEMENT_KEY });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: async () => {
      useEntitlementStore.getState().clearEntitlement();
      closeRevenueCat();
      useAuthStore.getState().clearSession();
      await queryClient.invalidateQueries({ queryKey: ENTITLEMENT_KEY });
    },
  });

  return {
    user,
    isSignedIn: Boolean(token),
    register,
    login,
    logout,
    deleteAccount: deleteAccountMutation,
  };
}
