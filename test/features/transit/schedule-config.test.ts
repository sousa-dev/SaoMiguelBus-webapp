/**
 * The changeover decision layer.
 *
 * The invariant that matters most is at the bottom: `searchDataset` must never
 * return `'legacy'`. A `dataset=legacy` echoed back from a stale bootstrap pins
 * the client to the dead network permanently, because the server treats an
 * explicit request as winning forever.
 */

import { describe, expect, it } from 'vitest';

import {
  bannerCopy,
  canPin,
  canTrack,
  msUntilTransition,
  nextPreviewDataset,
  resolveBanner,
  resolveScheduleUi,
  searchDataset,
  shouldInvalidateAt,
  simulatePhase,
  simulatedDataset,
} from '@/features/transit/lib/schedule-config';
import type { SchedulePhase, TransitScheduleConfig } from '@/lib/types';

const BANNER = {
  id: 'azoresbus-2026-09',
  tone: 'info' as const,
  dismissible: true,
  text: { pt: 'Nova rede', en: 'New network' },
};

function config(over: Partial<TransitScheduleConfig> = {}): TransitScheduleConfig {
  return {
    activeDataset: 'legacy',
    previewDataset: null,
    cutoverAt: null,
    nextTransitionAt: null,
    phase: 'preview',
    banner: null,
    badge: null,
    trackingEnabled: false,
    ...over,
  };
}

describe('resolveScheduleUi — the phase matrix', () => {
  it('unconfigured (cutoverAt null) shows nothing, even with a banner on the wire', () => {
    // Production is seeded with LIVE banner copy while no cutover is armed, so
    // this is the case that stops the app announcing a changeover that has not
    // happened.
    const ui = resolveScheduleUi(config({ banner: BANNER, badge: { text: { pt: 'x' } } }), {
      isPreviewing: false,
    });
    expect(ui.isConfigured).toBe(false);
    expect(ui.showBanner).toBe(false);
    expect(ui.showBadge).toBe(false);
    expect(ui.phase).toBeNull();
  });

  it('offers the toggle on previewDataset alone — deliberately NOT gated on cutoverAt', () => {
    // An admin flipping previewEnabled must see something happen without also
    // arming a cutover instant.
    const ui = resolveScheduleUi(config({ previewDataset: 'azoresbus' }), {
      isPreviewing: false,
    });
    expect(ui.showToggle).toBe(true);
    expect(ui.showBanner).toBe(false);
  });

  it('preview phase, configured: banner shows, badge does not', () => {
    const ui = resolveScheduleUi(
      config({
        cutoverAt: '2026-09-01T00:00:00Z',
        banner: BANNER,
        badge: { text: { pt: 'Válido' } },
        previewDataset: 'azoresbus',
      }),
      { isPreviewing: false },
    );
    expect(ui.showBanner).toBe(true);
    expect(ui.showBadge).toBe(false);
  });

  it('live phase: badge shows, banner still shows', () => {
    const ui = resolveScheduleUi(
      config({
        phase: 'live',
        cutoverAt: '2026-09-01T00:00:00Z',
        banner: BANNER,
        badge: { text: { pt: 'Válido' } },
      }),
      { isPreviewing: false },
    );
    expect(ui.showBadge).toBe(true);
    expect(ui.showBanner).toBe(true);
    // Previewing is over; there is nothing left to preview.
    expect(ui.showToggle).toBe(false);
  });

  it('settled phase retires both the banner and the badge', () => {
    const ui = resolveScheduleUi(
      config({
        phase: 'settled',
        cutoverAt: '2026-09-01T00:00:00Z',
        banner: BANNER,
        badge: { text: { pt: 'Válido' } },
      }),
      { isPreviewing: false },
    );
    expect(ui.showBanner).toBe(false);
    expect(ui.showBadge).toBe(false);
  });

  it('the preview warning rides on previewing, not on the phase alone', () => {
    const cfg = config({ previewDataset: 'azoresbus', cutoverAt: '2026-09-01T00:00:00Z' });
    expect(resolveScheduleUi(cfg, { isPreviewing: false }).showPreviewWarning).toBe(false);
    expect(resolveScheduleUi(cfg, { isPreviewing: true }).showPreviewWarning).toBe(true);
  });

  it('hasCrossedCutover compares against the supplied instant', () => {
    const cfg = config({ cutoverAt: '2026-09-01T00:00:00Z' });
    const before = Date.parse('2026-08-31T23:59:00Z');
    const after = Date.parse('2026-09-01T00:01:00Z');
    expect(resolveScheduleUi(cfg, { isPreviewing: false, now: before }).hasCrossedCutover).toBe(
      false,
    );
    expect(resolveScheduleUi(cfg, { isPreviewing: false, now: after }).hasCrossedCutover).toBe(
      true,
    );
  });

  it('tolerates a null config', () => {
    const ui = resolveScheduleUi(null, { isPreviewing: false });
    expect(ui.isConfigured).toBe(false);
    expect(ui.dataset).toBeNull();
  });
});

describe('searchDataset — the only value that ever goes on the wire', () => {
  it("NEVER returns 'legacy', for any input", () => {
    const phases: SchedulePhase[] = ['preview', 'live', 'settled'];
    const datasets = ['legacy', 'azoresbus', null] as const;
    for (const phase of phases) {
      for (const activeDataset of ['legacy', 'azoresbus'] as const) {
        for (const previewDataset of datasets) {
          for (const isPreviewing of [true, false]) {
            const value = searchDataset(
              config({ phase, activeDataset, previewDataset }),
              isPreviewing,
            );
            expect(value === 'azoresbus' || value === null).toBe(true);
          }
        }
      }
    }
    expect(searchDataset(null, true)).toBeNull();
    expect(searchDataset(undefined, true)).toBeNull();
  });

  it('is null when not previewing, however the server is configured', () => {
    expect(
      searchDataset(config({ activeDataset: 'azoresbus', previewDataset: 'azoresbus' }), false),
    ).toBeNull();
  });

  it("is 'azoresbus' only when previewing AND the server offers that preview", () => {
    expect(searchDataset(config({ previewDataset: 'azoresbus' }), true)).toBe('azoresbus');
    expect(searchDataset(config({ previewDataset: 'legacy' }), true)).toBeNull();
    expect(searchDataset(config({ previewDataset: null }), true)).toBeNull();
  });
});

describe('resolveBanner — per-phase overrides', () => {
  it('merges the phase override over the base banner', () => {
    const merged = resolveBanner(
      config({
        phase: 'live',
        banner: {
          ...BANNER,
          phases: { live: { id: 'live-2026-09', text: { pt: 'Em vigor' } } },
        },
      }),
    );
    expect(merged?.id).toBe('live-2026-09');
    expect(merged?.text.pt).toBe('Em vigor');
    // Untouched fields survive the merge.
    expect(merged?.dismissible).toBe(true);
  });

  it('returns the base banner when the phase has no override', () => {
    expect(resolveBanner(config({ banner: BANNER }))?.id).toBe(BANNER.id);
  });

  it('is null when there is no banner', () => {
    expect(resolveBanner(config())).toBeNull();
  });
});

describe('nextPreviewDataset — a toggle set in August must not survive September', () => {
  it('clears a stored preview once the phase leaves preview', () => {
    expect(
      nextPreviewDataset(config({ phase: 'live', previewDataset: null }), 'azoresbus'),
    ).toBeNull();
  });

  it('keeps a stored preview while it is still offered', () => {
    expect(
      nextPreviewDataset(config({ phase: 'preview', previewDataset: 'azoresbus' }), 'azoresbus'),
    ).toBe('azoresbus');
  });

  it('is null when nothing was stored', () => {
    expect(nextPreviewDataset(config({ previewDataset: 'azoresbus' }), null)).toBeNull();
  });
});

describe('canTrack / canPin', () => {
  it('tracking stands down while previewing a timetable not in force', () => {
    const cfg = config({ previewDataset: 'azoresbus' });
    expect(canTrack(cfg, true)).toBe(false);
    expect(canTrack(cfg, false)).toBe(true);
  });

  it('pinning survives the preview — a pin schedules nothing', () => {
    expect(canPin()).toBe(true);
  });
});

describe('cache invalidation at the transition instant', () => {
  const cfg = config({ nextTransitionAt: '2026-09-01T00:00:00Z' });
  const instant = Date.parse('2026-09-01T00:00:00Z');

  it('fires at or after the instant, not before', () => {
    expect(shouldInvalidateAt(cfg, instant - 1)).toBe(false);
    expect(shouldInvalidateAt(cfg, instant)).toBe(true);
  });

  it('never fires when nothing is scheduled', () => {
    expect(shouldInvalidateAt(config(), Date.now())).toBe(false);
  });

  it('reports the remaining wait, and null once it has passed', () => {
    expect(msUntilTransition(cfg, instant - 5000)).toBe(5000);
    expect(msUntilTransition(cfg, instant)).toBeNull();
  });
});

describe('simulatePhase — rehearsing the cutover', () => {
  const now = Date.parse('2026-08-18T12:00:00Z');

  it("'off' is identity", () => {
    const cfg = config({ previewDataset: 'azoresbus' });
    expect(simulatePhase(cfg, 'off', now)).toBe(cfg);
  });

  it('backdates the cutover so isConfigured and hasCrossedCutover agree with the phase', () => {
    const simulated = simulatePhase(config(), 'live', now)!;
    expect(simulated.phase).toBe('live');
    expect(simulated.activeDataset).toBe('azoresbus');
    expect(simulated.previewDataset).toBeNull();
    // Nothing further is scheduled, or the transition timer would immediately
    // refetch the real config back over the simulated one.
    expect(simulated.nextTransitionAt).toBeNull();
    const ui = resolveScheduleUi(simulated, { isPreviewing: false, now });
    expect(ui.isConfigured).toBe(true);
    expect(ui.hasCrossedCutover).toBe(true);
  });

  it('puts azoresbus on the wire, because the live server still serves legacy', () => {
    expect(simulatedDataset('off')).toBeNull();
    expect(simulatedDataset('live')).toBe('azoresbus');
    expect(simulatedDataset('settled')).toBe('azoresbus');
  });
});

describe('bannerCopy — locale → base lang → pt → first value', () => {
  const text = { pt: 'Português', en: 'English' };

  it('prefers the exact locale', () => {
    expect(bannerCopy({ text }, 'en')).toBe('English');
  });

  it('falls back to the base language of a regional tag', () => {
    expect(bannerCopy({ text }, 'en-GB')).toBe('English');
  });

  it('falls back to pt, then to whatever is there', () => {
    expect(bannerCopy({ text }, 'de')).toBe('Português');
    expect(bannerCopy({ text: { zh: '中文' } }, 'de')).toBe('中文');
  });

  it('is null with no copy at all', () => {
    expect(bannerCopy(null, 'pt')).toBeNull();
  });
});
