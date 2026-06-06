import { normalizeSearchText } from '@/lib/format';
import type { TourSummary } from '@/lib/types';

export type TourSortKey =
  | 'featured'
  | 'priceLow'
  | 'priceHigh'
  | 'rating'
  | 'durationShort'
  | 'durationLong';
export type TourRatingFilterKey = 'all' | '4' | '4.5';
export type TourPriceRangeKey = 'all' | 'budget' | 'mid' | 'premium';
export type TourDurationRangeKey = 'all' | 'short' | 'halfDay' | 'fullDay';

export interface TourFilters {
  search: string;
  sort: TourSortKey;
  rating: TourRatingFilterKey;
  price: TourPriceRangeKey;
  duration: TourDurationRangeKey;
}

export const DEFAULT_TOUR_FILTERS: TourFilters = {
  search: '',
  sort: 'featured',
  rating: 'all',
  price: 'all',
  duration: 'all',
};

function matchesRating(tour: TourSummary, key: TourRatingFilterKey): boolean {
  if (key === 'all') return true;
  const min = key === '4' ? 4 : 4.5;
  return (tour.rating ?? 0) >= min;
}

function matchesPrice(tour: TourSummary, key: TourPriceRangeKey): boolean {
  if (key === 'all') return true;
  const price = tour.fromPrice;
  if (price == null) return false;
  if (key === 'budget') return price < 50;
  if (key === 'mid') return price >= 50 && price <= 100;
  return price > 100;
}

function matchesDuration(tour: TourSummary, key: TourDurationRangeKey): boolean {
  if (key === 'all') return true;
  const mins = tour.durationMinutes;
  if (mins == null) return false;
  if (key === 'short') return mins < 180;
  if (key === 'halfDay') return mins >= 180 && mins < 360;
  return mins >= 360;
}

export function filterAndSortTours(tours: TourSummary[], filters: TourFilters): TourSummary[] {
  const q = normalizeSearchText(filters.search);
  const filtered = tours.filter(
    (tour) =>
      (!q || normalizeSearchText(tour.title).includes(q)) &&
      matchesRating(tour, filters.rating) &&
      matchesPrice(tour, filters.price) &&
      matchesDuration(tour, filters.duration),
  );

  const sorted = [...filtered];
  switch (filters.sort) {
    case 'priceLow':
      sorted.sort((a, b) => (a.fromPrice ?? Infinity) - (b.fromPrice ?? Infinity));
      break;
    case 'priceHigh':
      sorted.sort((a, b) => (b.fromPrice ?? -Infinity) - (a.fromPrice ?? -Infinity));
      break;
    case 'rating':
      sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      break;
    case 'durationShort':
      sorted.sort((a, b) => (a.durationMinutes ?? Infinity) - (b.durationMinutes ?? Infinity));
      break;
    case 'durationLong':
      sorted.sort((a, b) => (b.durationMinutes ?? -Infinity) - (a.durationMinutes ?? -Infinity));
      break;
    case 'featured':
    default:
      break;
  }
  return sorted;
}

export function formatDuration(
  minutes: number | null,
  t: (key: string, opts?: Record<string, unknown>) => string,
): string | null {
  if (minutes == null) return null;
  if (minutes < 60) return t('tourDurationMinutes', { minutes });
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return t('tourDurationHours', { hours: h });
  return t('tourDurationHoursMinutes', { hours: h, minutes: m });
}
