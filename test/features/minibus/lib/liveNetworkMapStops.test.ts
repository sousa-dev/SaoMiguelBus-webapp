import { describe, expect, it } from 'vitest';

import { findLiveMapStopPin, liveNetworkMapStops } from '@/features/minibus/lib/liveNetworkMapStops';
import type { MinibusLine, MinibusNetwork, MinibusNetworkStop } from '@/lib/types';

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

const catalogLines: MinibusLine[] = [
  {
    code: 'A',
    slug: 'line-a',
    name: 'Linha A',
    color: '#fbc707',
    sort_order: 1,
    service_summary: {},
  },
  {
    code: 'B',
    slug: 'line-b',
    name: 'Linha B',
    color: '#99d420',
    sort_order: 2,
    service_summary: {},
  },
];

const network: MinibusNetwork = {
  interchanges_by_key: {},
  lines: [
    {
      code: 'A',
      slug: 'line-a',
      name: 'Linha A',
      color: '#fbc707',
      direction: 'circular',
      stop_count: 2,
      stops: [
        stop({ sequence: 1, key: 'a-01', name_pt: 'Rua Zeta', latitude: 37.7, longitude: -25.6 }),
        stop({ sequence: 2, key: 'a-02', name_pt: 'Rua Alfa', latitude: 37.71, longitude: -25.61 }),
      ],
    },
    {
      code: 'B',
      slug: 'line-b',
      name: 'Linha B',
      color: '#99d420',
      direction: 'circular',
      stop_count: 1,
      // Shares Line A's stop 1 coordinate — must merge into one pin, not two.
      stops: [stop({ sequence: 1, key: 'b-01', name_pt: 'Rua Zeta (B)', latitude: 37.7, longitude: -25.6 })],
    },
  ],
};

describe('liveNetworkMapStops', () => {
  it('returns nothing without a network', () => {
    expect(liveNetworkMapStops(null, catalogLines, null)).toEqual([]);
  });

  it('merges stops at the same coordinate across lines into one pin', () => {
    const pins = liveNetworkMapStops(network, catalogLines, null);
    expect(pins).toHaveLength(2);
    const shared = pins.find((pin) => pin.stop.key === 'a-01' || pin.stop.key === 'b-01');
    expect(shared?.lines.map((l) => l.code).sort()).toEqual(['A', 'B']);
  });

  it('filters to one line and skips stops without coordinates', () => {
    const withMissing: MinibusNetwork = {
      ...network,
      lines: [
        {
          ...network.lines[0],
          stops: [
            ...network.lines[0].stops,
            stop({ sequence: 3, key: 'a-03', latitude: null, longitude: null }),
          ],
        },
      ],
    };
    const pins = liveNetworkMapStops(withMissing, catalogLines, 'line-a');
    expect(pins.map((pin) => pin.stop.key)).toEqual(['a-01', 'a-02']);
    expect(pins[0].lines).toEqual([{ code: 'A', color: '#fbc707', slug: 'line-a', sequence: 1 }]);
  });

  it('returns nothing when the selected line is not in the network', () => {
    expect(liveNetworkMapStops(network, catalogLines, 'line-z')).toEqual([]);
  });
});

describe('findLiveMapStopPin', () => {
  it('finds the pin whose stop key matches', () => {
    const pins = liveNetworkMapStops(network, catalogLines, null);
    const found = findLiveMapStopPin(pins, 'a-02');
    expect(found?.stop.key).toBe('a-02');
  });

  it('returns null when no pin matches', () => {
    const pins = liveNetworkMapStops(network, catalogLines, null);
    expect(findLiveMapStopPin(pins, 'nope')).toBeNull();
  });
});
