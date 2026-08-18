/**
 * The single source of truth for the changeover UI.
 *
 * Every component reads these hooks — nothing reads `bootstrap.transitSchedule`
 * directly, and nothing computes a phase from a date.
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import {
  bannerCopy,
  canTrack,
  msUntilTransition,
  nextPreviewDataset,
  resolveBanner,
  resolveScheduleUi,
  searchDataset,
  shouldInvalidateAt,
  simulatePhase,
  simulatedDataset,
  type ScheduleUi,
} from '@/features/transit/lib/schedule-config';
import { useSimulatedPhase } from '@/features/transit/lib/schedule-dev-store';
import { useBootstrap } from '@/hooks/useBootstrap';
import { useProfileStore } from '@/lib/store';
import type {
  TransitDataset,
  TransitScheduleBanner,
  TransitScheduleConfig,
} from '@/lib/types';

/**
 * Read once at import rather than per render.
 *
 * `simulatePhase` only uses this to BACKDATE `cutoverAt` by a day, so any
 * instant in the session works — and calling `Date.now()` during render makes
 * the memo's result depend on when React happened to re-run it.
 */
const SESSION_START = Date.now();

export interface ScheduleConfigView extends ScheduleUi {
  config: TransitScheduleConfig | null;
  /** True while a dev is previewing a post-cutover phase (never in production). */
  isSimulated: boolean;
  /** The banner for the current phase, with any per-phase overrides applied. */
  banner: TransitScheduleBanner | null;
  isPreviewing: boolean;
  setPreviewing: (on: boolean) => void;
  bannerText: string | null;
  badgeText: string | null;
  isBannerDismissed: boolean;
  dismissBanner: () => void;
  canTrackTrips: boolean;
}

export function useScheduleConfig(locale = 'pt'): ScheduleConfigView {
  const { data: bootstrap } = useBootstrap();
  const served = bootstrap?.transitSchedule ?? null;

  // Substituted at the source, so every consumer of this hook — banner, badge,
  // preview toggle, maps gate, request dataset — sees a consistent post-cutover
  // world rather than each growing its own flag. `'off'` in production, so this
  // is identity there.
  const simulated = useSimulatedPhase();
  const config = useMemo(
    () => simulatePhase(served, simulated, SESSION_START) ?? null,
    [served, simulated],
  );

  const stored = useProfileStore((s) => s.transitPreviewDataset);
  const setStored = useProfileStore((s) => s.setTransitPreviewDataset);
  const dismissedId = useProfileStore((s) => s.dismissedScheduleBannerId);
  const dismiss = useProfileStore((s) => s.dismissScheduleBanner);

  // A preview toggled in August must not survive into September.
  const effective = nextPreviewDataset(config, stored);
  useEffect(() => {
    if (stored !== effective) {
      setStored(effective);
    }
  }, [stored, effective, setStored]);

  const isPreviewing = effective != null;
  const ui = useMemo(
    () => resolveScheduleUi(config, { isPreviewing }),
    [config, isPreviewing],
  );

  const setPreviewing = useCallback(
    (on: boolean) => setStored(on ? searchDataset(config, true) : null),
    [config, setStored],
  );

  // The phase-resolved banner: copy and dismissal id both follow the phase, so a
  // banner dismissed during preview reappears when the changeover goes live.
  const banner = useMemo(() => resolveBanner(config), [config]);

  const dismissBanner = useCallback(() => {
    if (banner) {
      dismiss(banner.id);
    }
  }, [banner, dismiss]);

  return {
    ...ui,
    // The substituted config alone would give the September UI over August data:
    // the live server keeps serving the legacy network until the real cutover,
    // so the dataset has to go on the wire explicitly.
    dataset: simulated === 'off' ? ui.dataset : simulatedDataset(simulated),
    config,
    isSimulated: simulated !== 'off',
    isPreviewing,
    setPreviewing,
    banner,
    bannerText: ui.showBanner ? bannerCopy(banner, locale) : null,
    badgeText: ui.showBadge ? bannerCopy(config?.badge, locale) : null,
    // Dismissal is keyed on the banner id, so changing it server-side re-shows it.
    isBannerDismissed: banner != null && dismissedId === banner.id,
    dismissBanner,
    canTrackTrips: canTrack(config, isPreviewing),
  };
}

/** The dataset to send on transit requests — null unless actively previewing. */
export function useTransitDataset(): TransitDataset | null {
  return useScheduleConfig().dataset;
}

/**
 * Which network is ACTUALLY being searched — the preview override if one is on,
 * otherwise whatever the server says is active.
 *
 * Distinct from `useTransitDataset`, which answers "what should I put on the
 * wire" and is deliberately null when not previewing. Map entry points need the
 * resolved answer, because only AzoresBus carries route geometry: legacy has no
 * shapes and no poles, so offering a network or line map there leads nowhere.
 */
export function useResolvedTransitDataset(): TransitDataset | null {
  const { config, dataset } = useScheduleConfig();
  return dataset ?? config?.activeDataset ?? null;
}

/** setTimeout clamps above this, so long waits are re-armed on visibility instead. */
const MAX_TIMER_MS = 2 ** 31 - 1;

/**
 * Invalidate the transit cache at `nextTransitionAt`.
 *
 * The query defaults here (30 min stale, 24 h gc, no refetch on focus) mean that
 * without this, a config cached on 31 August is still being applied on
 * 1 September and a results page left open across the instant keeps August's
 * answers indefinitely.
 *
 * Two triggers, because either alone leaves a hole: a timer armed at the
 * instant, for a tab left open; and a visibility check, for a tab that was
 * hidden across it.
 */
export function useScheduleTransition(config: TransitScheduleConfig | null | undefined) {
  const queryClient = useQueryClient();
  const firedFor = useRef<string | null>(null);

  useEffect(() => {
    const invalidate = () => {
      const transition = config?.nextTransitionAt ?? null;
      // Once per transition instant: re-arming on every visibility change would
      // otherwise refetch the world each time the tab is looked at.
      if (firedFor.current === transition) {
        return;
      }
      firedFor.current = transition;
      void queryClient.invalidateQueries({ queryKey: ['bootstrap'] });
      void queryClient.invalidateQueries({ queryKey: ['transit'] });
    };

    const check = () => {
      if (shouldInvalidateAt(config, Date.now())) {
        invalidate();
      }
    };

    check();

    let timer: ReturnType<typeof setTimeout> | undefined;
    const delay = msUntilTransition(config, Date.now());
    if (delay != null && delay <= MAX_TIMER_MS) {
      timer = setTimeout(invalidate, delay);
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        check();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [config, queryClient]);
}
