// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/analytics', () => ({ track: vi.fn() }));
const api = vi.hoisted(() => ({
  fetchBootstrap: vi.fn(async () => ({
    island: { enabledModules: ['transit', 'minibus'] },
    holidays: [],
    transitSchedule: {
      activeDataset: 'azoresbus',
      previewDataset: null,
      cutoverAt: null,
      nextTransitionAt: null,
      phase: 'settled',
      banner: null,
      badge: null,
      trackingEnabled: true,
    },
  })),
  fetchStops: vi.fn(async () => []),
  fetchLiveVehicleCounts: vi.fn(
    async () => ({ azoresbus: { status: 'ok', vehicles: 4, recordedAt: '2026-09-06T10:00:00Z' }, minibus: null, ttlSeconds: 60 }),
  ),
  fetchAd: vi.fn(async () => null),
  fetchEntitlement: vi.fn(async () => ({ tier: 'free' })),
}));
vi.mock('@/lib/api', () => api);

import { setPremiumForTests } from '@/features/premium/usePremium';
import { journeyAsPinnedRoute, journeyTrackPayload } from '@/features/transit/tracking/journey-legs';
import { useTrackingStore } from '@/features/transit/tracking/tracking-store';
import { TransitPage } from '@/features/transit/TransitPage';
import { displayRouteNumber } from '@/lib/format';
import i18n from '@/lib/i18n';
import type { TransitJourney } from '@/lib/types';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { flush, mount, type Mounted } from '../../helpers/react';

await i18n.changeLanguage('en');

const journey = JSON.parse(
  readFileSync(join(process.cwd(), 'test', 'fixtures', 'azoresbus', 'journey-with-transfer.json'), 'utf8'),
).journey as TransitJourney;

let mounted: Mounted | null = null;

async function render() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  mounted = await mount(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/transit']}>
        <TransitPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  for (let i = 0; i < 5; i++) {
    await flush();
  }
  return mounted;
}

beforeEach(() => {
  localStorage.clear();
  useTrackingStore.getState().resetAll();
  useTrackingStore.getState().startTracking(journeyTrackPayload(journey, 'weekday', 'azoresbus', displayRouteNumber));
  useTrackingStore.getState().pinRoute(journeyAsPinnedRoute(journey, 'weekday', 'azoresbus', displayRouteNumber));
  setPremiumForTests({
    tier: 'premium',
    source: 'revenuecat',
    status: 'active',
    currentPeriodEnd: null,
    features: [],
    manageVia: 'web',
  });
});

afterEach(async () => {
  await mounted?.unmount();
  mounted = null;
});

describe('TransitPage section order', () => {
  it('renders premium and live sections before the planner, and the planner before the instructions, matching the mobile order', async () => {
    const m = await render();
    const html = m.container.innerHTML;

    const activeTrackingIndex = html.indexOf('data-testid="active-tracking"');
    const pinnedRoutesIndex = html.indexOf('data-testid="pinned-routes"');
    const liveEntryIndex = html.indexOf('Live tracking');
    const plannerIndex = html.indexOf('Choose your starting point');

    expect(activeTrackingIndex).toBeGreaterThan(-1);
    expect(pinnedRoutesIndex).toBeGreaterThan(activeTrackingIndex);
    expect(liveEntryIndex).toBeGreaterThan(pinnedRoutesIndex);
    expect(plannerIndex).toBeGreaterThan(liveEntryIndex);
  });
});
