import { beforeEach, describe, expect, it } from 'vitest';

import {
  resetInternalAdSlotPicksForTests,
  selectInternalCreative,
} from '@/features/ads/lib/internal-ads/select-creative';

describe('selectInternalCreative', () => {
  beforeEach(() => {
    resetInternalAdSlotPicksForTests();
  });

  it('returns a creative for enabled modules', () => {
    const creative = selectInternalCreative({
      slotKey: 'banner:test',
      enabledModuleKeys: ['events', 'trails'],
      random: () => 0.1,
    });
    expect(creative).toBeTruthy();
  });

  it('biases tours over many picks', () => {
    const counts = new Map<string, number>();
    for (let i = 0; i < 500; i++) {
      resetInternalAdSlotPicksForTests();
      const creative = selectInternalCreative({
        slotKey: `banner:${i}`,
        enabledModuleKeys: ['events', 'trails', 'weather'],
        random: () => Math.random(),
      });
      expect(creative).toBeTruthy();
      counts.set(creative!.id, (counts.get(creative!.id) ?? 0) + 1);
    }

    const tours = counts.get('module-events') ?? 0;
    const trails = counts.get('module-trails') ?? 0;
    expect(tours).toBeGreaterThan(trails);
  });

  it('reuses the same creative for a stable slot key', () => {
    const first = selectInternalCreative({
      slotKey: 'banner:stable',
      enabledModuleKeys: ['events', 'trails'],
      random: () => 0.99,
    });
    const second = selectInternalCreative({
      slotKey: 'banner:stable',
      enabledModuleKeys: ['events', 'trails'],
      random: () => 0.01,
    });
    expect(first?.id).toBe(second?.id);
  });
});
