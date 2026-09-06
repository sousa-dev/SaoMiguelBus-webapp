// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/analytics', () => ({ track: vi.fn() }));
const api = vi.hoisted(() => ({
  fetchBootstrap: vi.fn(async () => ({ island: { enabledModules: ['transit'] }, transitSchedule: null, holidays: [] })),
  searchTransitJourneys: vi.fn(),
}));
vi.mock('@/lib/api', () => api);

import { setPremiumForTests } from '@/features/premium/usePremium';
import { useAutoTrackPinnedRoutes } from '@/features/transit/pinned/hooks/useAutoTrackPinnedRoutes';
import { journeyAsPinnedRoute } from '@/features/transit/tracking/journey-legs';
import { useTrackingStore } from '@/features/transit/tracking/tracking-store';
import { displayRouteNumber } from '@/lib/format';
import type { TransitJourney } from '@/lib/types';
import { flush, mount, type Mounted } from '../../../helpers/react';

const journey = JSON.parse(
  readFileSync(join(process.cwd(), 'test', 'fixtures', 'azoresbus', 'journey-with-transfer.json'), 'utf8'),
).journey as TransitJourney;

const premium = {
  tier: 'premium' as const,
  source: 'revenuecat' as const,
  status: 'active',
  currentPeriodEnd: null,
  features: [],
  manageVia: 'web' as const,
};

function Probe() {
  useAutoTrackPinnedRoutes();
  return null;
}

let mounted: Mounted | null = null;

async function render() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  mounted = await mount(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  );
  for (let i = 0; i < 6; i++) {
    await flush();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
    });
  }
  return mounted;
}

/** Ten minutes before the fixture journey departs, on a Monday (a `weekday`). */
function tenMinutesBeforeDeparture(): Date {
  const [hours, minutes] = journey.start.split('h').map(Number);
  const date = new Date(2026, 8, 7, hours, minutes, 0, 0);
  date.setMinutes(date.getMinutes() - 10);
  return date;
}

beforeEach(() => {
  localStorage.clear();
  useTrackingStore.getState().resetAll();
  api.searchTransitJourneys.mockReset();
  api.searchTransitJourneys.mockResolvedValue({ journeys: [journey] });
  setPremiumForTests(premium);
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(tenMinutesBeforeDeparture());
});

afterEach(async () => {
  await mounted?.unmount();
  mounted = null;
  vi.useRealTimers();
});

describe('useAutoTrackPinnedRoutes', () => {
  it('arms a due pin once, from today\'s real timetable, and remembers it', async () => {
    useTrackingStore.getState().pinRoute(journeyAsPinnedRoute(journey, 'weekday', null, displayRouteNumber));
    await render();
    const { active, autoTracked, pinned } = useTrackingStore.getState();
    expect(api.searchTransitJourneys).toHaveBeenCalledTimes(1);
    expect(active).toHaveLength(1);
    expect(active[0].auto).toBe(true);
    expect(active[0].journeyId).toBe(journey.id);
    expect(Object.keys(autoTracked ?? {})).toEqual([`${pinned[0].id}|2026-09-07`]);

    // Stopping it must stick: the next "foreground" does not re-arm today's pin.
    useTrackingStore.getState().stopTracking(active[0].id);
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await flush();
    expect(useTrackingStore.getState().active).toHaveLength(0);
    expect(api.searchTransitJourneys).toHaveBeenCalledTimes(1);
  });

  it('does nothing for free users', async () => {
    setPremiumForTests(null);
    useTrackingStore.getState().pinRoute(journeyAsPinnedRoute(journey, 'weekday', null, displayRouteNumber));
    await render();
    expect(api.searchTransitJourneys).not.toHaveBeenCalled();
    expect(useTrackingStore.getState().active).toHaveLength(0);
  });
});
