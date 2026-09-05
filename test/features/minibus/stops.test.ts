import { describe, expect, it } from 'vitest';

import {
  displayStopSequence,
  isLoopTerminus,
  lineMapStops,
  networkStopNames,
} from '@/features/minibus/lib/stops';
import type { MinibusNetwork, MinibusNetworkStop } from '@/lib/types';

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

// Every Mini Bus line is circular: the schematic's last stop repeats the first
// stop's coordinates (the loop return), rather than being a distinct place.
const CIRCULAR_LINE: MinibusNetworkStop[] = [
  stop({ sequence: 1, key: 'a-01', latitude: 37.7, longitude: -25.6 }),
  stop({ sequence: 2, key: 'a-02' }),
  stop({ sequence: 3, key: 'a-03' }),
  stop({ sequence: 4, key: 'a-04', latitude: 37.7, longitude: -25.6 }), // loop return
];

describe('isLoopTerminus', () => {
  it('flags the last stop when it shares coordinates with the first', () => {
    expect(isLoopTerminus(CIRCULAR_LINE[3], CIRCULAR_LINE)).toBe(true);
  });

  it('does not flag an interior stop, even if some coordinate happens to be missing', () => {
    expect(isLoopTerminus(CIRCULAR_LINE[1], CIRCULAR_LINE)).toBe(false);
  });

  it('does not flag the last stop when its coordinates genuinely differ from the first', () => {
    const openLine = [
      stop({ sequence: 1, key: 'b-01', latitude: 37.7, longitude: -25.6 }),
      stop({ sequence: 2, key: 'b-02', latitude: 37.71, longitude: -25.61 }),
    ];
    expect(isLoopTerminus(openLine[1], openLine)).toBe(false);
  });
});

describe('displayStopSequence', () => {
  it('shows sequence 1 on the loop-return stop instead of the schematic last number', () => {
    expect(displayStopSequence(CIRCULAR_LINE[3], CIRCULAR_LINE)).toBe(1);
  });

  it('keeps the schematic sequence for every other stop', () => {
    expect(displayStopSequence(CIRCULAR_LINE[1], CIRCULAR_LINE)).toBe(2);
  });
});

describe('lineMapStops', () => {
  it('drops the loop-return duplicate so each physical stop gets one pin', () => {
    const pins = lineMapStops(CIRCULAR_LINE);
    expect(pins).toHaveLength(3);
    expect(pins.map((s) => s.key)).toEqual(['a-01', 'a-02', 'a-03']);
  });
});

describe('networkStopNames', () => {
  it('dedupes stop names across lines and sorts them', () => {
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
            stop({ sequence: 1, key: 'a-01', name_pt: 'Rua Zeta' }),
            stop({ sequence: 2, key: 'a-02', name_pt: 'Rua Alfa' }),
          ],
        },
        {
          code: 'B',
          slug: 'line-b',
          name: 'Linha B',
          color: '#99d420',
          direction: 'circular',
          stop_count: 1,
          // Shares a stop name with Line A — must not appear twice.
          stops: [stop({ sequence: 1, key: 'b-01', name_pt: 'Rua Zeta' })],
        },
      ],
    };
    expect(networkStopNames(network)).toEqual(['Rua Alfa', 'Rua Zeta']);
  });

  it('returns an empty list without a network', () => {
    expect(networkStopNames(null)).toEqual([]);
  });
});
