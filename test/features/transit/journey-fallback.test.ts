/**
 * Degrading journey search back to direct search.
 *
 * Transfer search is new; direct search has worked for years. The rule under
 * test is which failures are worth hiding from a rider who only wanted the
 * direct bus they could always find before.
 */

import { describe, expect, it } from 'vitest';

import {
  journeyFromSearchResult,
  journeyFromTripDetail,
  journeyRouteLabel,
  shouldFallBackToDirectSearch,
} from '@/features/transit/lib/journey-fallback';
import { ApiRequestError } from '@/lib/api-errors';
import { isRideLeg } from '@/lib/types';
import type { TransitSearchResult, TripDetail } from '@/lib/types';

describe('shouldFallBackToDirectSearch', () => {
  it('falls back on 404 — the API often has not been redeployed yet', () => {
    expect(shouldFallBackToDirectSearch(new ApiRequestError(404, ''))).toBe(true);
  });

  it('falls back on 5xx — journey search is broken in production', () => {
    expect(shouldFallBackToDirectSearch(new ApiRequestError(500, ''))).toBe(true);
    expect(shouldFallBackToDirectSearch(new ApiRequestError(502, ''))).toBe(true);
  });

  it('does NOT fall back on other 4xx — the request itself was wrong', () => {
    // A bad request would fail identically against /search, so retrying only
    // doubles the latency before the same error surfaces.
    expect(shouldFallBackToDirectSearch(new ApiRequestError(400, ''))).toBe(false);
    expect(shouldFallBackToDirectSearch(new ApiRequestError(403, ''))).toBe(false);
  });

  it('does NOT fall back on a network failure', () => {
    expect(shouldFallBackToDirectSearch(new TypeError('Failed to fetch'))).toBe(false);
    expect(shouldFallBackToDirectSearch(new Error('boom'))).toBe(false);
    expect(shouldFallBackToDirectSearch(null)).toBe(false);
  });
});

const RESULT: TransitSearchResult = {
  id: 488,
  route: '110',
  origin: 'CAPELAS (IGREJA)',
  destination: 'PONTA DELGADA (AVENIDA)',
  start: '08h20',
  end: '09h05',
  typeOfDay: 'WEEKDAY',
  likesPercent: 80,
  dislikesPercent: 20,
  information: {},
  stops: [
    { name: 'CAPELAS (IGREJA)', time: '08h20', sequence: 3 },
    { name: 'PONTA DELGADA (AVENIDA)', time: '09h05', sequence: 14 },
  ],
};

describe('journeyFromSearchResult', () => {
  it('produces a direct, one-ride journey', () => {
    const journey = journeyFromSearchResult(RESULT);
    expect(journey.transfers).toBe(0);
    expect(journey.waitMinutes).toBe(0);
    expect(journey.legs).toHaveLength(1);
    expect(journey.durationMinutes).toBe(45);
  });

  it("uses the server's own sequences, never a re-match by name", () => {
    const journey = journeyFromSearchResult({
      ...RESULT,
      boarding: { code: 'A 12', lat: 37.8, lon: -25.7, sequence: 3, dayOffset: 0 },
      alighting: { code: 'B 04', lat: 37.7, lon: -25.6, sequence: 14, dayOffset: 0 },
    });
    const leg = journey.legs[0];
    expect(isRideLeg(leg)).toBe(true);
    if (!isRideLeg(leg)) return;
    expect(leg.board.sequence).toBe(3);
    expect(leg.alight.sequence).toBe(14);
    expect(leg.boarding?.code).toBe('A 12');
  });

  it('omits boarding/alighting entirely on legacy rows, never nulls them', () => {
    const leg = journeyFromSearchResult(RESULT).legs[0];
    expect('boarding' in leg).toBe(false);
    expect('alighting' in leg).toBe(false);
  });

  it('carries the arrival day offset, which drives the +1 badge', () => {
    const journey = journeyFromSearchResult({
      ...RESULT,
      alighting: { code: 'B 04', lat: 37.7, lon: -25.6, sequence: 14, dayOffset: 1 },
    });
    expect(journey.dayOffset).toBe(1);
  });
});

const DETAIL: TripDetail = {
  id: 488,
  route: '110',
  typeOfDay: 'WEEKDAY',
  likes: 8,
  dislikes: 2,
  information: {},
  stops: [
    { name: 'A', time: '08h00', sequence: 1 },
    { name: 'B', time: '08h20', sequence: 2 },
    { name: 'C', time: '09h00', sequence: 3 },
  ],
};

describe('journeyFromTripDetail', () => {
  it('namespaces its id so it cannot collide with a search journey', () => {
    // A bare `488-1` would collide with the search result for the same trip
    // boarded at sequence 1, and the rider asking for the WHOLE trip would
    // silently get the board..alight slice instead.
    expect(journeyFromTripDetail(DETAIL).id).toBe('trip-detail:488');
    expect(journeyFromSearchResult(RESULT).id).toBe('488-3');
  });

  it('spans the whole trip, first stop to last', () => {
    const journey = journeyFromTripDetail(DETAIL);
    expect(journey.start).toBe('08h00');
    expect(journey.end).toBe('09h00');
    expect(journey.durationMinutes).toBe(60);
  });

  it('computes vote percents when the API did not send them', () => {
    const leg = journeyFromTripDetail(DETAIL).legs[0];
    if (!isRideLeg(leg)) throw new Error('expected a ride leg');
    expect(leg.likesPercent).toBe(80);
    expect(leg.dislikesPercent).toBe(20);
  });

  it('prefers the percents the API did send', () => {
    const leg = journeyFromTripDetail({ ...DETAIL, likesPercent: 55, dislikesPercent: 45 })
      .legs[0];
    if (!isRideLeg(leg)) throw new Error('expected a ride leg');
    expect(leg.likesPercent).toBe(55);
  });
});

describe('journeyRouteLabel', () => {
  it('names every bus the rider takes, skipping the changes between them', () => {
    const journey = journeyFromSearchResult(RESULT);
    journey.legs = [
      journey.legs[0],
      {
        kind: 'transfer',
        at: 'X',
        from: 'X',
        waitMinutes: 12,
        walkMinutes: 0,
        slackMinutes: 12,
        tight: true,
        fromRoute: '110',
        toRoute: '205',
      },
      { ...(journey.legs[0] as never), route: 'C205' },
    ];
    expect(journeyRouteLabel(journey, (r) => r.replace(/C/gi, ''))).toBe('110 → 205');
  });
});
