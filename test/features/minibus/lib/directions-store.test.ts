import { describe, expect, it } from 'vitest';

import { consumePendingDirections, setPendingDirections } from '@/features/minibus/lib/directions-store';
import type { MinibusJourney } from '@/lib/types';

const journey = { transfers: 0, total_stops: 1, transfer_stops: [], legs: [] } as unknown as MinibusJourney;

describe('directions-store', () => {
  it('returns null when nothing is pending', () => {
    expect(consumePendingDirections()).toBeNull();
  });

  it('returns and clears the pending journey exactly once', () => {
    setPendingDirections(journey);
    expect(consumePendingDirections()).toBe(journey);
    expect(consumePendingDirections()).toBeNull();
  });
});
