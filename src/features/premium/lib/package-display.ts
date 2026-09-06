import type { Package } from '@revenuecat/purchases-js';

export type PackageDurationLabel = { value: number; unit: 'days' | 'months' };

/**
 * The paywall shows short periods in days and long ones in months (matching the
 * store-listing convention: "7 days" / "30 days" / "12 months" rather than
 * "1 week" / "1 month" / "1 year").
 */
export function packageDurationLabel(pkg: Package): PackageDurationLabel {
  const period = pkg.webBillingProduct.period;
  if (!period) return { value: 0, unit: 'days' };

  switch (period.unit) {
    case 'day':
      return { value: period.number, unit: 'days' };
    case 'week':
      return { value: period.number * 7, unit: 'days' };
    case 'month':
      return period.number === 1 ? { value: 30, unit: 'days' } : { value: period.number, unit: 'months' };
    case 'year':
      return { value: period.number * 12, unit: 'months' };
    default:
      return { value: 0, unit: 'days' };
  }
}

/** Trial length in whole days, or null when there is no trial or it isn't day-denominated. */
export function packageTrialDays(pkg: Package): number | null {
  const trial = pkg.webBillingProduct.freeTrialPhase;
  if (!trial?.period || trial.period.unit !== 'day') return null;
  return trial.period.number;
}
