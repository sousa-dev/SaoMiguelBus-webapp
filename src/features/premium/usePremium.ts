import { create } from 'zustand';

import {
  clearPremiumCookies,
  getPremiumEmailFromCookie,
  renewPremiumCookies,
  type SubscriptionVerifyResult,
} from '@/features/premium/subscription-cookies';
import { verifySubscriptionEmail } from '@/lib/api';

interface PremiumState {
  isPremium: boolean;
  isLoading: boolean;
  userEmail: string | null;
  refresh: () => Promise<void>;
}

export const usePremiumStore = create<PremiumState>((set) => ({
  isPremium: false,
  isLoading: true,
  userEmail: null,
  refresh: async () => {
    set({ isLoading: true });
    const savedEmail = getPremiumEmailFromCookie();
    if (!savedEmail) {
      set({ isPremium: false, isLoading: false, userEmail: null });
      return;
    }

    try {
      const data: SubscriptionVerifyResult = await verifySubscriptionEmail(savedEmail);
      if (data.hasActiveSubscription && data.expiresAt) {
        renewPremiumCookies(savedEmail, data.expiresAt);
        set({ isPremium: true, isLoading: false, userEmail: savedEmail });
        return;
      }
      clearPremiumCookies();
      set({ isPremium: false, isLoading: false, userEmail: null });
    } catch {
      set({ isPremium: false, isLoading: false, userEmail: savedEmail });
    }
  },
}));

export function usePremium(): boolean {
  return usePremiumStore((s) => s.isPremium);
}

export function usePremiumLoading(): boolean {
  return usePremiumStore((s) => s.isLoading);
}

export function useCanShowAds(): boolean {
  const isPremium = usePremiumStore((s) => s.isPremium);
  const isLoading = usePremiumStore((s) => s.isLoading);
  return !isPremium && !isLoading;
}
