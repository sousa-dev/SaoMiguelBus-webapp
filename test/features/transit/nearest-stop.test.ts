import { describe, expect, it } from 'vitest';

import type { JourneyMapPin } from '@/features/transit/lib/journey-map-data';
import {
  CLOSER_STOP_MIN_SAVING_METRES,
  formatWalkDistance,
  nearestStops,
  shouldIncludeUserInBounds,
} from '@/features/transit/lib/nearest-stop';

// Roughly 0.001° of latitude is 111 m; the pins below sit on one meridian so
// the distances are easy to reason about.
const LNG = -25.67;
const pin = (
  id: number,
  kind: JourneyMapPin['kind'],
  lat: number,
  legIndex = 0,
): JourneyMapPin => ({
  id: `p${id}`,
  kind,
  legIndex,
  stopId: id,
  name: `Stop ${id}`,
  time: '10:00',
  coordinate: [lat, LNG],
  step: id,
  color: '#000',
});

const direct: JourneyMapPin[] = [
  pin(1, 'board', 37.74),
  pin(2, 'stop', 37.745),
  pin(3, 'stop', 37.75),
  pin(4, 'alight', 37.76),
];

describe('nearestStops', () => {
  it('measures the boarding stop and finds no closer stop when standing at it', () => {
    const result = nearestStops(direct, { lat: 37.74, lng: LNG });
    expect(result.boarding).toHaveLength(1);
    expect(result.boarding[0].pin.stopId).toBe(1);
    expect(result.boarding[0].metres).toBeLessThan(1);
    expect(result.nearest?.pin.stopId).toBe(1);
    expect(result.closer).toBeNull();
  });

  it('suggests an intermediate stop when it saves a real walk', () => {
    const result = nearestStops(direct, { lat: 37.75018, lng: LNG });
    expect(result.closer?.pin.stopId).toBe(3);
    expect(result.closer!.savesMetres).toBeGreaterThanOrEqual(CLOSER_STOP_MIN_SAVING_METRES);
  });

  it('stays quiet when the closer stop barely saves anything', () => {
    const result = nearestStops(direct, { lat: 37.7428, lng: LNG });
    expect(result.nearest?.pin.stopId).toBe(2);
    expect(result.closer).toBeNull();
  });

  it('lists both boarding stops of a two-bus journey, in order', () => {
    const twoLegs: JourneyMapPin[] = [
      pin(1, 'board', 37.74),
      pin(2, 'change', 37.75, 1),
      pin(3, 'alight', 37.76, 1),
    ];
    const result = nearestStops(twoLegs, { lat: 37.7501, lng: LNG });
    expect(result.boarding.map((b) => b.pin.stopId)).toEqual([1, 2]);
    expect(result.closer?.pin.stopId).toBe(2);
  });

  it('still measures everything when the user is far away', () => {
    const result = nearestStops(direct, { lat: 37.9, lng: LNG });
    expect(result.boarding[0].metres).toBeGreaterThan(15000);
    expect(shouldIncludeUserInBounds(result)).toBe(false);
  });

  it('includes a nearby user in the framing', () => {
    const result = nearestStops(direct, { lat: 37.742, lng: LNG });
    expect(shouldIncludeUserInBounds(result)).toBe(true);
    expect(shouldIncludeUserInBounds(null)).toBe(false);
  });

  it('handles a journey with no pins', () => {
    expect(nearestStops([], { lat: 37.74, lng: LNG })).toEqual({
      boarding: [],
      nearest: null,
      closer: null,
    });
  });
});

describe('formatWalkDistance', () => {
  it('rounds short walks to ten metres', () => {
    expect(formatWalkDistance(347)).toBe('350 m');
    expect(formatWalkDistance(3)).toBe('10 m');
  });

  it('switches to kilometres with one decimal in the locale', () => {
    expect(formatWalkDistance(1234, 'en')).toBe('1.2 km');
    expect(formatWalkDistance(1234, 'pt')).toBe('1,2 km');
    expect(formatWalkDistance(3000, 'en')).toBe('3 km');
  });
});
