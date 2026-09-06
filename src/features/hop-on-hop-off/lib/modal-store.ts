import { create } from 'zustand';

import type { HopOnOffSource } from './analytics';

interface HopOnHopOffModalState {
  open: boolean;
  source: HopOnOffSource;
  openCount: number;
  openSheet: (source: HopOnOffSource) => void;
  close: () => void;
}

export const useHopOnHopOffModalStore = create<HopOnHopOffModalState>((set) => ({
  open: false,
  source: 'hub',
  openCount: 0,
  openSheet: (source) => set((state) => ({ open: true, source, openCount: state.openCount + 1 })),
  close: () => set({ open: false }),
}));
