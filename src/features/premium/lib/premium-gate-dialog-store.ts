import { create } from 'zustand';

/** A premium-only action a free rider can tap. Keys are shared with the Expo app. */
export type PremiumFeature = 'track' | 'pin' | 'notify';

/** i18n keys for the explainer shown before the paywall, per feature. */
export const PREMIUM_FEATURE_COPY: Record<PremiumFeature, { title: string; body: string }> = {
  track: { title: 'premiumGateTrackTitle', body: 'premiumGateTrackBody' },
  pin: { title: 'premiumGatePinTitle', body: 'premiumGatePinBody' },
  notify: { title: 'premiumGateNotifyTitle', body: 'premiumGateNotifyBody' },
};

export interface OpenPremiumGateOptions {
  feature: PremiumFeature;
  /** Paywall source tag (analytics + `/premium?source=`). */
  source: string;
  /** Runs after the rider taps Continue; the caller opens the paywall here. */
  onContinue: () => void;
}

interface PremiumGateDialogState {
  open: boolean;
  feature: PremiumFeature | null;
  source: string;
  onContinue: (() => void) | null;
  /** Increments per open so the dialog remounts with fresh state. */
  openCount: number;
  openDialog: (options: OpenPremiumGateOptions) => void;
  close: () => void;
}

export const usePremiumGateDialogStore = create<PremiumGateDialogState>((set) => ({
  open: false,
  feature: null,
  source: '',
  onContinue: null,
  openCount: 0,
  openDialog: (options) =>
    set((state) => ({
      open: true,
      feature: options.feature,
      source: options.source,
      onContinue: options.onContinue,
      openCount: state.openCount + 1,
    })),
  close: () => set({ open: false, onContinue: null }),
}));

/** Open the global "this is a premium feature" explainer from anywhere (premium gates). */
export function openPremiumGateDialog(options: OpenPremiumGateOptions): void {
  usePremiumGateDialogStore.getState().openDialog(options);
}
