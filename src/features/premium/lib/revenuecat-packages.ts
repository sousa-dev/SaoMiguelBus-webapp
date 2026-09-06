import type { Package } from '@revenuecat/purchases-js';

export type BillingPeriod = 'week' | 'month' | 'year' | 'other';

/** `normalPeriodDuration` is ISO 8601 (`P1M`, `P1Y`, `P1W`). */
export function periodFromDuration(duration: string | null | undefined): BillingPeriod {
  switch (duration) {
    case 'P1M':
      return 'month';
    case 'P1Y':
      return 'year';
    case 'P1W':
    case 'P7D':
      return 'week';
    default:
      return 'other';
  }
}

function rank(pkg: Package): number {
  const period = periodFromDuration(pkg.webBillingProduct?.normalPeriodDuration);
  if (pkg.packageType === '$rc_weekly' || period === 'week') return 0;
  if (pkg.packageType === '$rc_monthly' || period === 'month') return 1;
  if (pkg.packageType === '$rc_annual' || period === 'year') return 2;
  return 3;
}

/** Weekly, then monthly, then yearly, then the rest; stable within a rank. */
export function sortPackages(packages: Package[]): Package[] {
  return packages
    .map((pkg, index) => ({ pkg, index, rank: rank(pkg) }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map((entry) => entry.pkg);
}

export function packagePriceLabel(pkg: Package): { price: string; period: BillingPeriod } {
  const product = pkg.webBillingProduct;
  return {
    price: product.currentPrice.formattedPrice,
    period: periodFromDuration(product.normalPeriodDuration),
  };
}
