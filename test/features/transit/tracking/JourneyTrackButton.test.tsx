// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { act } from 'react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/analytics', () => ({ track: vi.fn() }));
vi.mock('@/lib/api', () => ({
  fetchBootstrap: vi.fn(async () => ({ island: { enabledModules: ['transit'] }, transitSchedule: null })),
  fetchTransitTripsLive: vi.fn(async () => ({ trips: [] })),
}));

import { JourneyTrackButton } from '@/features/transit/tracking/components/JourneyTrackButton';
import { MAX_ACTIVE_TRACKS, useTrackingStore } from '@/features/transit/tracking/tracking-store';
import { setPremiumForTests } from '@/features/premium/usePremium';
import i18n from '@/lib/i18n';
import { useNoticeStore } from '@/lib/notice-store';
import type { TransitJourney } from '@/lib/types';
import { flush, mount, type Mounted } from '../../../helpers/react';

await i18n.changeLanguage('en');

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

let mounted: Mounted | null = null;

function Where() {
  const location = useLocation();
  return <span data-testid="where">{location.pathname + location.search}</span>;
}

async function render() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  mounted = await mount(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/transit']}>
        <JourneyTrackButton journey={journey} searchDay="weekday" />
        <Where />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  await flush();
  return mounted;
}

function button(label: string): HTMLButtonElement {
  const el = mounted!.container.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);
  if (!el) throw new Error(`no button ${label}`);
  return el;
}

beforeEach(() => {
  localStorage.clear();
  useTrackingStore.getState().resetAll();
  useNoticeStore.setState({ queue: [] });
  setPremiumForTests(null);
});

afterEach(async () => {
  await mounted?.unmount();
  mounted = null;
});

describe('JourneyTrackButton', () => {
  it('sends a free user to the paywall instead of starting a track', async () => {
    const m = await render();
    await act(async () => {
      button('Track trip').click();
    });
    expect(useTrackingStore.getState().active).toHaveLength(0);
    expect(m.container.querySelector('[data-testid="where"]')!.textContent).toBe('/premium?source=track_start');
  });

  it('starts and stops a track for a premium user; stopping is never gated', async () => {
    setPremiumForTests(premium);
    const m = await render();
    await act(async () => {
      button('Track trip').click();
    });
    expect(useTrackingStore.getState().active).toHaveLength(1);
    expect(useTrackingStore.getState().active[0].journeyId).toBe(journey.id);
    expect(m.container.querySelector('[data-testid="where"]')!.textContent).toBe('/transit');

    setPremiumForTests(null);
    await flush();
    await act(async () => {
      button('Stop tracking').click();
    });
    expect(useTrackingStore.getState().active).toHaveLength(0);
  });

  it('pins and unpins the whole itinerary', async () => {
    setPremiumForTests(premium);
    await render();
    await act(async () => {
      button('Pin route').click();
    });
    expect(useTrackingStore.getState().pinned).toHaveLength(1);
    expect(useTrackingStore.getState().pinned[0].journeyId).toBe(journey.id);
    await act(async () => {
      button('Unpin').click();
    });
    expect(useTrackingStore.getState().pinned).toHaveLength(0);
  });

  it('explains the cap instead of silently failing', async () => {
    setPremiumForTests(premium);
    const store = useTrackingStore.getState();
    for (let i = 0; i < MAX_ACTIVE_TRACKS; i++) {
      store.startTracking({
        routeNumber: `${i}`,
        origin: 'A',
        destination: 'B',
        searchDay: 'weekday',
        searchDate: '2026-09-07',
        journeyId: `other-${i}`,
        legs: [{ tripId: 1000 + i, routeNumber: `${i}`, origin: 'A', destination: 'B', start: '09h00', end: '09h30', stops: [] }],
        transfers: [],
        nextDeparture: '09h00',
        estimatedArrival: '09h30',
      });
    }
    await render();
    await act(async () => {
      button('Track trip').click();
    });
    expect(useTrackingStore.getState().active).toHaveLength(MAX_ACTIVE_TRACKS);
    expect(useNoticeStore.getState().queue[0]?.title).toBe('Tracking limit');
  });
});
