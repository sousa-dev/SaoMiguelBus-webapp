import type { Package } from '@revenuecat/purchases-js';
import { describe, expect, it } from 'vitest';

import { packageDurationLabel, packageTrialDays } from '@/features/premium/lib/package-display';

function pkg(overrides: {
  period?: { number: number; unit: string } | null;
  trial?: { number: number; unit: string } | null;
}): Package {
  return {
    webBillingProduct: {
      period: overrides.period ?? null,
      freeTrialPhase: overrides.trial ? { period: overrides.trial } : null,
    },
  } as unknown as Package;
}

describe('packageDurationLabel', () => {
  it('shows a week in days', () => {
    expect(packageDurationLabel(pkg({ period: { number: 1, unit: 'week' } }))).toEqual({
      value: 7,
      unit: 'days',
    });
  });

  it('shows a single month approximated as 30 days', () => {
    expect(packageDurationLabel(pkg({ period: { number: 1, unit: 'month' } }))).toEqual({
      value: 30,
      unit: 'days',
    });
  });

  it('shows a year in months', () => {
    expect(packageDurationLabel(pkg({ period: { number: 1, unit: 'year' } }))).toEqual({
      value: 12,
      unit: 'months',
    });
  });

  it('shows several months directly', () => {
    expect(packageDurationLabel(pkg({ period: { number: 3, unit: 'month' } }))).toEqual({
      value: 3,
      unit: 'months',
    });
  });

  it('falls back to days=0 without period info', () => {
    expect(packageDurationLabel(pkg({ period: null }))).toEqual({ value: 0, unit: 'days' });
  });
});

describe('packageTrialDays', () => {
  it('returns the trial length in days', () => {
    expect(packageTrialDays(pkg({ trial: { number: 3, unit: 'day' } }))).toBe(3);
  });

  it('returns null without a trial', () => {
    expect(packageTrialDays(pkg({ trial: null }))).toBeNull();
  });

  it('returns null when the trial unit is not days', () => {
    expect(packageTrialDays(pkg({ trial: { number: 1, unit: 'week' } }))).toBeNull();
  });
});
