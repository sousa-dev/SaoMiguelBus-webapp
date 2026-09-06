// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { act } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/analytics', () => ({ track: vi.fn() }));
const api = vi.hoisted(() => ({
  fetchBootstrap: vi.fn(async () => ({ island: { enabledModules: ['transit'] }, transitSchedule: null })),
  fetchTransitTripsLive: vi.fn(async () => ({ trips: [] })),
}));
vi.mock('@/lib/api', () => api);

import { setPremiumForTests } from '@/features/premium/usePremium';
import { ActiveTrackingSection } from '@/features/transit/tracking/components/ActiveTrackingSection';
import { journeyTrackPayload } from '@/features/transit/tracking/journey-legs';
import { useTrackingStore } from '@/features/transit/tracking/tracking-store';
import { displayRouteNumber } from '@/lib/format';
import i18n from '@/lib/i18n';
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

async function render() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  mounted = await mount(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ActiveTrackingSection />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  await flush();
  return mounted;
}

beforeEach(() => {
  localStorage.clear();
  useTrackingStore.getState().resetAll();
  api.fetchTransitTripsLive.mockClear();
  setPremiumForTests(premium);
});

afterEach(async () => {
  await mounted?.unmount();
  mounted = null;
});

describe('ActiveTrackingSection', () => {
  it('renders nothing without tracks, and nothing for free users even with tracks', async () => {
    let m = await render();
    expect(m.container.innerHTML).toBe('');
    await m.unmount();

    useTrackingStore.getState().startTracking(journeyTrackPayload(journey, 'weekday', 'azoresbus', displayRouteNumber));
    setPremiumForTests(null);
    m = await render();
    expect(m.container.innerHTML).toBe('');
  });

  it('shows each track with its route, endpoints, status and a stop button', async () => {
    const payload = journeyTrackPayload(journey, 'weekday', 'azoresbus', displayRouteNumber);
    useTrackingStore.getState().startTracking(payload);
    const m = await render();
    const text = m.container.textContent ?? '';
    expect(text).toContain(payload.routeNumber);
    expect(text).toContain(`${payload.origin} → ${payload.destination}`);
    expect(text).toContain('Estimated from the timetable');
    expect(api.fetchTransitTripsLive).toHaveBeenCalled();

    const stop = m.container.querySelector<HTMLButtonElement>('button[aria-label="Stop tracking"]')!;
    await act(async () => {
      stop.click();
    });
    expect(useTrackingStore.getState().active).toHaveLength(0);
  });
});
