// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/analytics', () => ({ track: vi.fn() }));
const api = vi.hoisted(() => ({
  fetchBootstrap: vi.fn(async () => ({ island: { enabledModules: ['transit', 'minibus'] }, transitSchedule: null })),
  fetchMinibusTrackingHealth: vi.fn(),
  fetchMinibusVehicles: vi.fn(),
  fetchMinibusVehicle: vi.fn(),
  fetchMinibusLines: vi.fn(),
  fetchMinibusNetwork: vi.fn(),
  fetchMinibusLine: vi.fn(),
  fetchAd: vi.fn(async () => null),
}));
vi.mock('@/lib/api', () => api);
vi.mock('@/features/ads/components/AdBanner', () => ({ AdBanner: () => null }));
vi.mock('@/components/map/LiveVehicleMap', () => ({
  LiveVehicleMap: ({
    vehicles,
    onSelectVehicle,
    stopPins,
    onSelectStop,
  }: {
    vehicles: Array<{ id: string; lineCode: string | null }>;
    onSelectVehicle: (id: string) => void;
    stopPins?: Array<{ id: string }>;
    onSelectStop?: (id: string) => void;
  }) => (
    <div data-testid="map">
      {vehicles.map((v) => (
        <button key={v.id} type="button" data-testid={`vehicle-${v.id}`} onClick={() => onSelectVehicle(v.id)}>
          {v.id}:{v.lineCode ?? '?'}
        </button>
      ))}
      {(stopPins ?? []).map((pin) => (
        <button key={pin.id} type="button" data-testid={`stop-${pin.id}`} onClick={() => onSelectStop?.(pin.id)}>
          {pin.id}
        </button>
      ))}
    </div>
  ),
}));

import { MinibusLivePage } from '@/features/minibus/live/MinibusLivePage';
import i18n from '@/lib/i18n';
import { flush, mount, type Mounted } from '../../helpers/react';

await i18n.changeLanguage('en');

const meta = {
  cachedAt: '2026-09-06T10:00:00Z',
  stale: false,
  cacheMaxAgeSeconds: 30,
  trackingAttribution: 'Eleven Systems',
  trackingSourceUrl: 'https://example.test',
  provider: 'pdl',
  attribution: 'PDL',
};
const lines = [
  { id: 1, code: 'A', slug: 'linha-a', name: 'Linha A', color: 'f6bc1c' },
  { id: 2, code: 'B', slug: 'linha-b', name: 'Linha B', color: '00964c' },
];
const fleet = [
  { id: 'm1', position: { lat: 37.74, lon: -25.67 }, status: 'inTransitTo', color: 'f6bc1c' },
  { id: 'm2', position: { lat: 37.75, lon: -25.66 }, status: 'idleAt', color: '00964c', fleetId: '42' },
];

function stop(overrides: { key: string; name_pt: string; sequence: number; latitude: number; longitude: number }) {
  return { ...overrides, match_key: overrides.key, interchange_key: overrides.key, interchange_lines: [] };
}

const network = {
  interchanges_by_key: {},
  lines: [
    {
      code: 'A',
      slug: 'linha-a',
      name: 'Linha A',
      color: 'f6bc1c',
      direction: 'circular',
      stop_count: 1,
      stops: [stop({ key: 'a-01', name_pt: 'Portas do Mar', sequence: 1, latitude: 37.74, longitude: -25.67 })],
    },
    {
      code: 'B',
      slug: 'linha-b',
      name: 'Linha B',
      color: '00964c',
      direction: 'circular',
      stop_count: 1,
      stops: [stop({ key: 'b-01', name_pt: 'Hospital', sequence: 1, latitude: 37.75, longitude: -25.66 })],
    },
  ],
};

let mounted: Mounted | null = null;

async function render(path = '/minibus/live') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  mounted = await mount(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <MinibusLivePage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  for (let i = 0; i < 5; i++) {
    await flush();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
    });
  }
  return mounted;
}

beforeEach(() => {
  api.fetchMinibusTrackingHealth.mockReset();
  api.fetchMinibusVehicles.mockReset();
  api.fetchMinibusVehicle.mockReset();
  api.fetchMinibusLines.mockReset();
  api.fetchMinibusNetwork.mockReset();
  api.fetchMinibusLine.mockReset();
  api.fetchMinibusTrackingHealth.mockResolvedValue({ available: true, checkedAt: meta.cachedAt, recheckAfterSeconds: 30 });
  api.fetchMinibusVehicles.mockResolvedValue({ ...meta, vehicles: fleet });
  api.fetchMinibusLines.mockResolvedValue({ lines });
  api.fetchMinibusNetwork.mockResolvedValue(network);
  api.fetchMinibusLine.mockResolvedValue({ ...lines[1], route_shapes: [] });
  api.fetchMinibusVehicle.mockResolvedValue({
    ...meta,
    vehicle: {
      ...fleet[0],
      currentStopSequence: 2,
      journey: {
        shape: null,
        circulations: [
          { sequence: 1, stage: { id: 's1', name: 'PORTAS DO MAR', nameShort: 'PM' } },
          { sequence: 2, stage: { id: 's2', name: 'MERCADO DA GRAÇA', nameShort: 'MG' }, dueInMinutes: 0 },
          { sequence: 3, stage: { id: 's3', name: 'HOSPITAL', nameShort: 'HO' }, dueInMinutes: 6 },
        ],
      },
    },
  });
});

afterEach(async () => {
  await mounted?.unmount();
  mounted = null;
});

describe('MinibusLivePage', () => {
  it('shows the outage state when the feed is unavailable', async () => {
    api.fetchMinibusTrackingHealth.mockResolvedValue({ available: false, checkedAt: meta.cachedAt, recheckAfterSeconds: 30, reason: 'upstream' });
    const m = await render();
    expect(m.container.textContent).toContain('Try again');
    expect(api.fetchMinibusVehicles).not.toHaveBeenCalled();
  });

  it('renders the fleet coloured by line, filters by ?line=, and opens a vehicle panel', async () => {
    let m = await render();
    expect(m.container.querySelector('[data-testid="vehicle-m1"]')!.textContent).toBe('m1:A');
    expect(m.container.querySelector('[data-testid="vehicle-m2"]')!.textContent).toBe('m2:B');
    await act(async () => {
      m.container.querySelector<HTMLButtonElement>('[data-testid="vehicle-m1"]')!.click();
    });
    for (let i = 0; i < 4; i++) {
      await flush();
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));
      });
    }
    expect(m.container.textContent).toContain('Mercado da Graça');
    expect(m.container.textContent).toContain('6 min');
    await m.unmount();

    m = await render('/minibus/live?line=linha-b');
    expect(m.container.querySelector('[data-testid="vehicle-m1"]')).toBeNull();
    expect(m.container.querySelector('[data-testid="vehicle-m2"]')).not.toBeNull();
  });

  it('shows a fleet bar listing every visible vehicle, collapsing when one is selected', async () => {
    const m = await render();
    expect(m.container.textContent).toContain('Live buses (2)');
    expect(m.container.textContent).toContain('Fleet 42');

    await act(async () => {
      m.container.querySelector<HTMLButtonElement>('[data-testid="vehicle-m1"]')!.click();
    });
    for (let i = 0; i < 4; i++) {
      await flush();
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));
      });
    }
    // The fleet list collapses once a vehicle is focused; only the header remains.
    expect(m.container.textContent).not.toContain('Fleet 42');
  });

  it('shows no stop pins by default, but shows them once the stops toggle is on', async () => {
    let m = await render();
    expect(m.container.querySelector('[data-testid="stop-a-01"]')).toBeNull();

    const toggle = Array.from(m.container.querySelectorAll('button')).find((b) => b.textContent === 'Show stops')!;
    await act(async () => {
      toggle.click();
    });
    expect(m.container.querySelector('[data-testid="stop-a-01"]')).not.toBeNull();
    expect(m.container.querySelector('[data-testid="stop-b-01"]')).not.toBeNull();
    await m.unmount();

    // A line filter alone also forces stops on, for just that line.
    m = await render('/minibus/live?line=linha-b');
    expect(m.container.querySelector('[data-testid="stop-b-01"]')).not.toBeNull();
    expect(m.container.querySelector('[data-testid="stop-a-01"]')).toBeNull();
  });

  it('tapping a stop pin opens a dialog with the lines serving it, no "view live" pill', async () => {
    const m = await render();
    const toggle = Array.from(m.container.querySelectorAll('button')).find((b) => b.textContent === 'Show stops')!;
    await act(async () => {
      toggle.click();
    });
    await act(async () => {
      m.container.querySelector<HTMLButtonElement>('[data-testid="stop-a-01"]')!.click();
    });
    const dialog = document.body.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog!.textContent).toContain('Portas do Mar');
    expect(dialog!.textContent).not.toContain('View live');
  });
});
