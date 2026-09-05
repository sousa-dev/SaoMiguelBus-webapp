import { create } from 'zustand';

interface StoreChooserContent {
  title: string;
  body: string;
}

interface StoreChooserState {
  open: boolean;
  content: StoreChooserContent | null;
  show: (content?: StoreChooserContent) => void;
  hide: () => void;
}

export const useStoreChooserStore = create<StoreChooserState>((set) => ({
  open: false,
  content: null,
  show: (content) => set({ open: true, content: content ?? null }),
  hide: () => set({ open: false, content: null }),
}));
