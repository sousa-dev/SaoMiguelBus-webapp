import { create } from 'zustand';

/** Web analog of React Native's `Alert.alert`: a queued, one-at-a-time informational dialog. */
export interface Notice {
  id: number;
  title: string;
  message?: string;
}

interface NoticeState {
  queue: Notice[];
  push: (notice: Omit<Notice, 'id'>) => void;
  dismiss: () => void;
}

let sequence = 0;

export const useNoticeStore = create<NoticeState>((set) => ({
  queue: [],
  push: (notice) => set((state) => ({ queue: [...state.queue, { ...notice, id: ++sequence }] })),
  dismiss: () => set((state) => ({ queue: state.queue.slice(1) })),
}));

export function showNotice(notice: Omit<Notice, 'id'>): void {
  useNoticeStore.getState().push(notice);
}
