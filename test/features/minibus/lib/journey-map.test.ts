import { describe, expect, it } from 'vitest';

import { journeyHasMapCoordinates, journeyPolylines, legPolyline } from '@/features/minibus/lib/journey-map';
import type { MinibusJourney, MinibusStopRef } from '@/lib/types';

function stopRef(overrides: Partial<MinibusStopRef> & { key: string; name: string; sequence: number }): MinibusStopRef {
  return { line_code: 'A', latitude: 37.7, longitude: -25.6, ...overrides };
}

const journey: MinibusJourney = {
  transfers: 0,
  total_stops: 2,
  transfer_stops: [],
  legs: [
    {
      line_code: 'A',
      line_slug: 'line-a',
      line_name: 'Linha Amarela',
      line_color: '#fbc707',
      board: stopRef({ key: 'a-01', name: 'Portas do Mar', sequence: 1, latitude: 37.74, longitude: -25.66 }),
      alight: stopRef({ key: 'a-02', name: 'Hospital', sequence: 2, latitude: 37.75, longitude: -25.65 }),
      stops: [
        stopRef({ key: 'a-01', name: 'Portas do Mar', sequence: 1, latitude: 37.74, longitude: -25.66 }),
        stopRef({ key: 'a-02', name: 'Hospital', sequence: 2, latitude: 37.75, longitude: -25.65 }),
      ],
      num_stops: 2,
      departure_time: null,
      arrival_time: null,
    },
  ],
};

describe('legPolyline', () => {
  it('walks every stop with coordinates, in order', () => {
    const coords = legPolyline(journey.legs[0]);
    expect(coords).toEqual([
      { latitude: 37.74, longitude: -25.66 },
      { latitude: 37.75, longitude: -25.65 },
    ]);
  });

  it('drops stops missing a coordinate rather than breaking the line', () => {
    const legWithGap = {
      ...journey.legs[0],
      stops: [journey.legs[0].stops[0], stopRef({ key: 'a-gap', name: 'Gap', sequence: 2, latitude: null, longitude: null })],
    };
    expect(legPolyline(legWithGap)).toEqual([{ latitude: 37.74, longitude: -25.66 }]);
  });
});

describe('journeyPolylines', () => {
  it('builds one colored polyline per leg, skipping legs with no coordinates', () => {
    const lines = journeyPolylines(journey);
    expect(lines).toHaveLength(1);
    expect(lines[0].color).toBe('#fbc707');
    expect(lines[0].coordinates).toHaveLength(2);
  });

  it('falls back to a default color when the leg has none', () => {
    const noColorJourney: MinibusJourney = {
      ...journey,
      legs: [{ ...journey.legs[0], line_color: null }],
    };
    expect(journeyPolylines(noColorJourney)[0].color).toBe('#2563eb');
  });
});

describe('journeyHasMapCoordinates', () => {
  it('is true when at least one leg has coordinates', () => {
    expect(journeyHasMapCoordinates(journey)).toBe(true);
  });

  it('is false when no stop anywhere has coordinates', () => {
    const noCoords: MinibusJourney = {
      ...journey,
      legs: [
        {
          ...journey.legs[0],
          stops: journey.legs[0].stops.map((s) => ({ ...s, latitude: null, longitude: null })),
        },
      ],
    };
    expect(journeyHasMapCoordinates(noCoords)).toBe(false);
  });
});
