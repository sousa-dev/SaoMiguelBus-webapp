import type { Package } from '@revenuecat/purchases-js';
import { describe, expect, it } from 'vitest';

import {
  packagePriceLabel,
  periodFromDuration,
  sortPackages,
} from '@/features/premium/lib/revenuecat-packages';

function pkg(identifier: string, duration: string | null, price = '€2.99'): Package {
  return {
    identifier,
    packageType: identifier,
    webBillingProduct: {
      identifier: `${identifier}_product`,
      currentPrice: { formattedPrice: price, amount: 2.99, amountMicros: 2_990_000, currency: 'EUR' },
      normalPeriodDuration: duration,
    },
  } as unknown as Package;
}

describe('periodFromDuration', () => {
  it('maps ISO 8601 durations onto display periods', () => {
    expect(periodFromDuration('P1M')).toBe('month');
    expect(periodFromDuration('P1Y')).toBe('year');
    expect(periodFromDuration('P1W')).toBe('week');
    expect(periodFromDuration('P6M')).toBe('other');
    expect(periodFromDuration(null)).toBe('other');
  });
});

describe('sortPackages', () => {
  it('orders monthly, then yearly, then everything else, keeping relative order', () => {
    const annual = pkg('$rc_annual', 'P1Y', '€19.99');
    const monthly = pkg('$rc_monthly', 'P1M');
    const lifetime = pkg('$rc_lifetime', null, '€49.99');
    const weekly = pkg('$rc_weekly', 'P1W');
    expect(sortPackages([lifetime, annual, weekly, monthly]).map((p) => p.identifier)).toEqual([
      '$rc_monthly',
      '$rc_annual',
      '$rc_lifetime',
      '$rc_weekly',
    ]);
  });
});

describe('packagePriceLabel', () => {
  it('returns the formatted price and the period', () => {
    expect(packagePriceLabel(pkg('$rc_annual', 'P1Y', '€19.99'))).toEqual({
      price: '€19.99',
      period: 'year',
    });
    expect(packagePriceLabel(pkg('$rc_monthly', 'P1M'))).toEqual({ price: '€2.99', period: 'month' });
  });
});
