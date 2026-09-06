import { describe, expect, it } from 'vitest';

import { liveFilteredLineRoute } from '@/features/minibus/live/lib/liveFilteredLineRoute';
import type { MinibusNetworkLine, MinibusNetworkStop } from '@/lib/types';

function stop(overrides: Partial<MinibusNetworkStop> & { sequence: number; key: string }): MinibusNetworkStop {
  return {
    name_pt: `Stop ${overrides.sequence}`,
    match_key: `stop-${overrides.sequence}`,
    interchange_key: `stop-${overrides.sequence}`,
    interchange_lines: [],
    latitude: 37.7 + overrides.sequence * 0.001,
    longitude: -25.6 + overrides.sequence * 0.001,
    ...overrides,
  };
}

const networkLine: MinibusNetworkLine = {
  code: 'A',
  slug: 'line-a',
  name: 'Linha A',
  color: '#fbc707',
  direction: 'circular',
  stop_count: 2,
  stops: [
    stop({ sequence: 1, key: 'a-01' }),
    stop({ sequence: 2, key: 'a-02' }),
  ],
};

describe('liveFilteredLineRoute', () => {
  it('prefers the direction-0 AVL shape when it decodes to plausible coordinates', () => {
    // Encodes [[37.74, -25.66], [37.75, -25.65]].
    const encoded = '_bjeF~ur{Co}@o}@';
    const route = liveFilteredLineRoute(networkLine, [
      { direction: 1, encoded_polyline: undefined },
      { direction: 0, encoded_polyline: encoded },
    ]);
    expect(route).toEqual([
      [37.74, -25.66],
      [37.75, -25.65],
    ]);
  });

  it('falls back to stop-to-stop segments when there is no usable shape', () => {
    const route = liveFilteredLineRoute(networkLine, null);
    expect(route).toHaveLength(2);
    expect(route![0][0]).toBeCloseTo(37.701);
    expect(route![0][1]).toBeCloseTo(-25.599);
    expect(route![1][0]).toBeCloseTo(37.702);
    expect(route![1][1]).toBeCloseTo(-25.598);
  });

  it('returns undefined when neither a shape nor a network line is available', () => {
    expect(liveFilteredLineRoute(undefined, null)).toBeUndefined();
  });

  it('returns undefined when the fallback line has fewer than 2 placeable stops', () => {
    const oneStop: MinibusNetworkLine = { ...networkLine, stops: [networkLine.stops[0]] };
    expect(liveFilteredLineRoute(oneStop, null)).toBeUndefined();
  });
});
