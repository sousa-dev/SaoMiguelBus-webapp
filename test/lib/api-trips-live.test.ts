// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchTransitTripsLive } from '@/lib/api';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchTransitTripsLive', () => {
  it('returns an empty list without a request when there are no ids', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    expect(await fetchTransitTripsLive([])).toEqual({ trips: [] });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('dedupes ids, chunks at five per request and merges the answers', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      const ids = new URL(url).searchParams.get('tripIds')!.split(',').map(Number);
      return {
        ok: true,
        status: 200,
        json: async () => ({ trips: ids.map((tripId) => ({ tripId, state: 'not_found', vehicle: null })) }),
        text: async () => '',
      };
    });
    vi.stubGlobal('fetch', fetchMock);
    const result = await fetchTransitTripsLive([1, 2, 3, 4, 5, 6, 6, 7]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(new URL(fetchMock.mock.calls[0][0]).searchParams.get('tripIds')).toBe('1,2,3,4,5');
    expect(new URL(fetchMock.mock.calls[1][0]).searchParams.get('tripIds')).toBe('6,7');
    expect(result.trips.map((t) => t.tripId)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('collapses a failing chunk to no trips instead of throwing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 503, json: async () => ({}), text: async () => 'disabled' })),
    );
    expect(await fetchTransitTripsLive([1])).toEqual({ trips: [] });
  });
});
