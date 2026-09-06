import { describe, expect, it } from 'vitest';

import {
  buildJourneySteps,
  isJourneyStepHighlighted,
  journeyMapMarkers,
  resolveJourneyMapMarker,
} from '@/features/minibus/lib/journeySteps';
import type { MinibusJourney, MinibusStopRef } from '@/lib/types';

function stopRef(overrides: Partial<MinibusStopRef> & { key: string; name: string; sequence: number }): MinibusStopRef {
  return { line_code: 'A', latitude: 37.7, longitude: -25.6, ...overrides };
}

const t = (key: string, opts?: Record<string, unknown>) => {
  if (!opts) return key;
  return `${key}(${Object.entries(opts).map(([k, v]) => `${k}=${v}`).join(',')})`;
};

const directJourney: MinibusJourney = {
  transfers: 0,
  total_stops: 3,
  transfer_stops: [],
  legs: [
    {
      line_code: 'A',
      line_slug: 'line-a',
      line_name: 'Linha Amarela',
      line_color: '#fbc707',
      board: stopRef({ key: 'a-01', name: 'Portas do Mar', sequence: 1, latitude: 37.74, longitude: -25.66 }),
      alight: stopRef({ key: 'a-03', name: 'Hospital', sequence: 3, latitude: 37.75, longitude: -25.65 }),
      stops: [
        stopRef({ key: 'a-01', name: 'Portas do Mar', sequence: 1, latitude: 37.74, longitude: -25.66 }),
        stopRef({ key: 'a-02', name: 'Mercado', sequence: 2, latitude: 37.745, longitude: -25.655 }),
        stopRef({ key: 'a-03', name: 'Hospital', sequence: 3, latitude: 37.75, longitude: -25.65 }),
      ],
      num_stops: 3,
      departure_time: null,
      arrival_time: null,
    },
  ],
};

const transferJourney: MinibusJourney = {
  transfers: 1,
  total_stops: 4,
  transfer_stops: [{ name: 'Praça', from_line: 'A', to_line: 'B' }],
  legs: [
    {
      ...directJourney.legs[0],
      alight: stopRef({ key: 'a-praca', name: 'Praça', sequence: 2, latitude: 37.741, longitude: -25.661 }),
      stops: [directJourney.legs[0].board, stopRef({ key: 'a-praca', name: 'Praça', sequence: 2 })],
      num_stops: 2,
    },
    {
      line_code: 'B',
      line_slug: 'line-b',
      line_name: 'Linha Verde',
      line_color: '#00964c',
      board: stopRef({ key: 'b-praca', name: 'Praça', sequence: 1, latitude: 37.741, longitude: -25.661 }),
      alight: stopRef({ key: 'b-02', name: 'Câmara', sequence: 2, latitude: 37.742, longitude: -25.662 }),
      stops: [
        stopRef({ key: 'b-praca', name: 'Praça', sequence: 1, latitude: 37.741, longitude: -25.661 }),
        stopRef({ key: 'b-02', name: 'Câmara', sequence: 2, latitude: 37.742, longitude: -25.662 }),
      ],
      num_stops: 2,
      departure_time: null,
      arrival_time: null,
    },
  ],
};

describe('buildJourneySteps', () => {
  it('builds board/ride/alight for a direct journey with no transfer', () => {
    const steps = buildJourneySteps(directJourney, t);
    expect(steps.map((s) => s.kind)).toEqual(['board', 'ride', 'alight']);
    expect(steps.map((s) => s.stepNumber)).toEqual([1, 2, 3]);
    expect(steps[1].detail).toContain('count=2');
  });

  it('inserts a transfer step between legs, numbered continuously', () => {
    const steps = buildJourneySteps(transferJourney, t);
    expect(steps.map((s) => s.kind)).toEqual(['board', 'alight', 'transfer', 'board', 'alight']);
    expect(steps.map((s) => s.stepNumber)).toEqual([1, 2, 3, 4, 5]);
    expect(steps[2].detail).toContain('stop=Praça');
  });

  it('omits the ride step for a 2-stop leg', () => {
    const steps = buildJourneySteps(transferJourney, t);
    expect(steps.some((s) => s.kind === 'ride')).toBe(false);
  });
});

describe('journeyMapMarkers', () => {
  it('collapses a transfer (alight + board at the same coordinate) into one marker', () => {
    const steps = buildJourneySteps(transferJourney, t);
    const markers = journeyMapMarkers(steps);
    // board(A), alight(A)=board(B) collapsed, alight(B) — not 4 raw coordinate steps.
    expect(markers).toHaveLength(3);
    // The collapsed marker keeps the LATEST step at that coordinate (leg-B's board,
    // step 4) over the earlier leg-A alight (step 2) and transfer (step 3).
    const collapsed = markers.find((m) => m.coordinate.latitude === 37.741);
    expect(collapsed?.kind).toBe('board');
    expect(collapsed?.color).toBe('#00964c');
  });

  it('skips ride steps and steps without a coordinate', () => {
    const steps = buildJourneySteps(directJourney, t);
    const markers = journeyMapMarkers(steps);
    expect(markers.map((m) => m.kind)).toEqual(['board', 'alight']);
  });
});

describe('resolveJourneyMapMarker / isJourneyStepHighlighted', () => {
  it('resolves a ride step (no marker of its own) to the marker at the same coordinate', () => {
    const steps = buildJourneySteps(directJourney, t);
    const markers = journeyMapMarkers(steps);
    const rideStep = steps.find((s) => s.kind === 'ride')!;
    // The ride step has no coordinate, so it resolves to nothing — but the board step does.
    expect(resolveJourneyMapMarker(markers, steps, rideStep.key)).toBeNull();
    const boardStep = steps.find((s) => s.kind === 'board')!;
    expect(resolveJourneyMapMarker(markers, steps, boardStep.key)?.kind).toBe('board');
  });

  it('highlights the collapsed transfer step for both the leg-A alight and leg-B board keys', () => {
    const steps = buildJourneySteps(transferJourney, t);
    const transferStep = steps.find((s) => s.kind === 'transfer')!;
    const boardB = steps.find((s) => s.kind === 'board' && s.key.startsWith('board-B'))!;
    expect(isJourneyStepHighlighted(boardB.key, transferStep.key, steps)).toBe(true);
  });

  it('does not highlight an unrelated step', () => {
    const steps = buildJourneySteps(transferJourney, t);
    const transferStep = steps.find((s) => s.kind === 'transfer')!;
    const boardA = steps.find((s) => s.kind === 'board' && s.key.startsWith('board-A'))!;
    expect(isJourneyStepHighlighted(boardA.key, transferStep.key, steps)).toBe(false);
  });
});
