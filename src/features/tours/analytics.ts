import { track } from '@/lib/analytics';

import type { TourFilters } from '@/features/tours/filterHelpers';

export function trackTourOpen(code: string, title: string) {
  track('tours', 'open', { tour_code: code, title });
}

export function trackTourBookClick(code: string) {
  track('tours', 'book_click', { tour_code: code });
}

export function trackTourFilter(filters: TourFilters) {
  track('tours', 'filter', {
    query: filters.search.trim() || undefined,
    sort: filters.sort,
    rating: filters.rating,
    price: filters.price,
    duration: filters.duration,
  });
}
