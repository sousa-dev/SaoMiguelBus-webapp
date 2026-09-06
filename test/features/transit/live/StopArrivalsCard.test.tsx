// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/analytics', () => ({ track: vi.fn() }));
const api = vi.hoisted(() => ({
  fetchAzoresbusStopArrivals: vi.fn(),
  fetchAzoresbusTrackingHealth: vi.fn(async () => ({ status: 'ok', vehicles: 5 })),
}));
vi.mock('@/lib/api', () => api);

import { StopArrivalsCard } from '@/features/transit/live/components/StopArrivalsCard';
import i18n from '@/lib/i18n';
import { flush, mount, type Mounted } from '../../../helpers/react';

await i18n.changeLanguage('en');

let mounted: Mounted | null = null;

async function render() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  mounted = await mount(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <StopArrivalsCard stopId={42} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  for (let i = 0; i < 4; i++) {
    await flush();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
    });
  }
  return mounted;
}

beforeEach(() => {
  api.fetchAzoresbusStopArrivals.mockReset();
  api.fetchAzoresbusTrackingHealth.mockResolvedValue({ status: 'ok', vehicles: 5 });
});

afterEach(async () => {
  await mounted?.unmount();
  mounted = null;
});

describe('StopArrivalsCard', () => {
  it('lists inbound buses with their line, name and ETA, linking to the live map', async () => {
    api.fetchAzoresbusStopArrivals.mockResolvedValue({
      arrivals: [
        { vehicleId: 'v1', dueInMinutes: 0, lineCode: '110', lineName: 'Ponta Delgada – Ribeira Grande', lineColor: '2D59A9', journeyId: 'j1', stale: false },
        { vehicleId: 'v2', dueInMinutes: 7, lineCode: '205', lineName: 'Lagoa', lineColor: '2D59A9', journeyId: 'j2', stale: true },
      ],
    });
    const m = await render();
    const text = m.container.textContent ?? '';
    expect(text).toContain('110');
    expect(text).toContain('Ponta Delgada – Ribeira Grande');
    expect(text).toContain('Now');
    expect(text).toContain('~7');
    const links = Array.from(m.container.querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(links).toContain('/transit/live?vehicle=v1');
  });

  it('says when nothing is inbound rather than pretending the feed is down', async () => {
    api.fetchAzoresbusStopArrivals.mockResolvedValue({ arrivals: [] });
    const m = await render();
    expect(m.container.textContent).toContain('No buses');
  });

  it('renders nothing when the feed is disabled or unavailable', async () => {
    api.fetchAzoresbusTrackingHealth.mockResolvedValue({ status: 'disabled', vehicles: 0 });
    const m = await render();
    expect(m.container.innerHTML).toBe('');
    expect(api.fetchAzoresbusStopArrivals).not.toHaveBeenCalled();
  });
});
