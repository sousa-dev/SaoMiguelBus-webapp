import { create } from 'zustand';

interface StoreChooserState {
  open: boolean;
  show: () => void;
  hide: () => void;
}

export const useStoreChooserStore = create<StoreChooserState>((set) => ({
  open: false,
  show: () => set({ open: true }),
  hide: () => set({ open: false }),
}));
