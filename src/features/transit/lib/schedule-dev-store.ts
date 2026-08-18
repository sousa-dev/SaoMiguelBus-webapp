/**
 * Cutover rehearsal — seeing 1 September before 1 September.
 *
 * The phase is server state, not something the client derives from a date, so
 * there is nothing a tester can reach by moving the machine clock: the app would
 * keep receiving `phase: 'preview'` and behave exactly as it does today.
 * Simulating means SUBSTITUTING the config, which `simulatePhase` does purely.
 *
 * The mobile app gates this on `__DEV__ || user.isSuperuser`. The webapp has no
 * accounts, so the only gate available is the build mode — and that is the right
 * one anyway: this must never be reachable in production, where a stray toggle
 * would announce a changeover that has not happened.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { SimulatedPhase } from '@/features/transit/lib/schedule-config';

export const canSimulateSchedule: boolean = import.meta.env.DEV;

interface ScheduleDevState {
  phase: SimulatedPhase;
  setPhase: (phase: SimulatedPhase) => void;
}

export const useScheduleDevStore = create<ScheduleDevState>()(
  persist(
    (set) => ({
      phase: 'off',
      setPhase: (phase) => set({ phase }),
    }),
    { name: 'smb_schedule_dev' },
  ),
);

/** `'off'` in production, unconditionally — this hook is identity there. */
export function useSimulatedPhase(): SimulatedPhase {
  const phase = useScheduleDevStore((s) => s.phase);
  return canSimulateSchedule ? phase : 'off';
}
