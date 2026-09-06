import { create } from 'zustand';

export type SignInMode = 'login' | 'register';

export interface OpenSignInOptions {
  /** Where the request came from (analytics + copy). */
  reason: string;
  mode?: SignInMode;
  prefillEmail?: string;
  /** Runs once after a successful sign-in or registration (e.g. resume a purchase). */
  onSuccess?: () => void;
}

interface SignInDialogState {
  open: boolean;
  mode: SignInMode;
  prefillEmail: string;
  reason: string;
  onSuccess: (() => void) | null;
  /** Increments per open so the form remounts with fresh state. */
  openCount: number;
  openDialog: (options: OpenSignInOptions) => void;
  setMode: (mode: SignInMode) => void;
  close: () => void;
}

export const useSignInDialogStore = create<SignInDialogState>((set) => ({
  open: false,
  mode: 'login',
  prefillEmail: '',
  reason: '',
  onSuccess: null,
  openCount: 0,
  openDialog: (options) =>
    set((state) => ({
      open: true,
      mode: options.mode ?? 'login',
      prefillEmail: options.prefillEmail ?? '',
      reason: options.reason,
      onSuccess: options.onSuccess ?? null,
      openCount: state.openCount + 1,
    })),
  setMode: (mode) => set({ mode }),
  close: () => set({ open: false, onSuccess: null }),
}));

/** Open the global sign-in dialog from anywhere (header, paywall, premium gates). */
export function openSignInDialog(options: OpenSignInOptions): void {
  useSignInDialogStore.getState().openDialog(options);
}
