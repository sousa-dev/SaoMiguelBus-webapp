import { track } from '@/lib/analytics';

export type TrailListFilters = {
  difficulty?: string;
  shape?: string;
  minLength?: number;
  maxLength?: number;
};

export function trackTrailFilter(filters: TrailListFilters) {
  track('trails', 'filter', {
    difficulty: filters.difficulty,
    shape: filters.shape,
    min_length: filters.minLength,
    max_length: filters.maxLength,
  });
}
