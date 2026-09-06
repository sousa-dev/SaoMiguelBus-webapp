// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { track } = vi.hoisted(() => ({ track: vi.fn() }));
vi.mock('@/lib/analytics', () => ({ track }));
const api = vi.hoisted(() => ({
  fetchBootstrap: vi.fn(async () => ({ island: { enabledModules: ['transit'] }, transitSchedule: null })),
  fetchAzoresbusTrackingHealth: vi.fn(),
  fetchAzoresbusVehicles: vi.fn(),
  fetchAzoresbusVehicle: vi.fn(),
  fetchAd: vi.fn(async () => null),
}));
vi.mock('@/lib/api', () => api);
// The ad slot and Leaflet are exercised elsewhere; here only the page's state machine matters.
vi.mock('@/features/ads/components/AdBanner', () => ({ AdBanner: () => null }));
vi.mock('@/components/map/LiveVehicleMap', () => ({
  LiveVehicleMap: ({
    vehicles,
    onSelectVehicle,
  }: {
    vehicles: Array<{ id: string }>;
    onSelectVehicle: (id: string) => void;
  }) => (
    <div data-testid="map">
      {vehicles.map((v) => (
        <button key={v.id} type="button" data-testid={`vehicle-${v.id}`} onClick={() => onSelectVehicle(v.id)}>
          {v.id}
        </button>
      ))}
    </div>
  ),
}));

import { LiveMapPage } from '@/features/transit/live/LiveMapPage';
import i18n from '@/lib/i18n';
import { flush, mount, type Mounted } from '../../../helpers/react';

await i18n.changeLanguage('en');

const route110 = { id: 'r110', nameShort: '110', name: 'Ponta Delgada – Ribeira Grande', color: '2D59A9' };
const route205 = { id: 'r205', nameShort: '205', name: 'Lagoa', color: 'E5322D' };
const fleet = [
  { id: 'v1', position: { lat: 37.74, lon: -25.67 }, status: 'ontime', color: '2D59A9', route: route110 },
  { id: 'v2', position: { lat: 37.75, lon: -25.6 }, status: 'delayed', delay: 300, color: 'E5322D', route: route205 },
];

let mounted: Mounted | null = null;

async function render(path = '/transit/live') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  mounted = await mount(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <LiveMapPage />
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
  track.mockClear();
  api.fetchAzoresbusTrackingHealth.mockReset();
  api.fetchAzoresbusVehicles.mockReset();
  api.fetchAzoresbusVehicle.mockReset();
  api.fetchAzoresbusTrackingHealth.mockResolvedValue({ status: 'ok', vehicles: 2 });
  api.fetchAzoresbusVehicles.mockResolvedValue({ vehicles: fleet });
  api.fetchAzoresbusVehicle.mockResolvedValue({
    ...fleet[0],
    fleetId: 'F1',
    licensePlate: '',
    currentStopSequence: 2,
    journey: {
      id: 'j1',
      type: 'regular',
      shape: '',
      circulations: [
        { sequence: 1, stage: { id: 's1', name: 'P. DELGADA', nameShort: 'PD', canonicalName: 'Ponta Delgada', stopId: 10 } },
        { sequence: 2, stage: { id: 's2', name: 'LAGOA', nameShort: 'LG', canonicalName: 'Lagoa', stopId: 11 }, dueInMinutes: 0 },
        { sequence: 3, stage: { id: 's3', name: 'R. GRANDE', nameShort: 'RG', canonicalName: 'Ribeira Grande', stopId: 12 }, dueInMinutes: 12 },
      ],
    },
  });
});

afterEach(async () => {
  await mounted?.unmount();
  mounted = null;
});

describe('LiveMapPage', () => {
  it('shows the outage state with a retry when the feed is unavailable or disabled', async () => {
    api.fetchAzoresbusTrackingHealth.mockResolvedValue({ status: 'unavailable', vehicles: 0 });
    const m = await render();
    expect(m.container.textContent).toContain("Live tracking isn't available right now");
    expect(Array.from(m.container.querySelectorAll('button')).some((b) => b.textContent === 'Try again')).toBe(true);
    expect(api.fetchAzoresbusVehicles).not.toHaveBeenCalled();
  });

  it('says when nobody is reporting rather than showing an error', async () => {
    api.fetchAzoresbusVehicles.mockResolvedValue({ vehicles: [] });
    const m = await render();
    expect(m.container.textContent).toContain('No buses reporting right now.');
  });

  it('renders the fleet with line chips, and selecting a bus opens its panel with stops and ETAs', async () => {
    const m = await render();
    expect(m.container.querySelector('[data-testid="vehicle-v1"]')).not.toBeNull();
    expect(m.container.querySelector('[data-testid="vehicle-v2"]')).not.toBeNull();
    const chips = Array.from(m.container.querySelectorAll('button')).map((b) => b.textContent);
    expect(chips).toContain('110');
    expect(chips).toContain('205');
    expect(track).toHaveBeenCalledWith('transit', 'live_view', expect.anything());

    await act(async () => {
      m.container.querySelector<HTMLButtonElement>('[data-testid="vehicle-v1"]')!.click();
    });
    for (let i = 0; i < 4; i++) {
      await flush();
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));
      });
    }
    const text = m.container.textContent ?? '';
    expect(text).toContain('Line 110');
    expect(text).toContain('Ribeira Grande');
    expect(text).toContain('12 min');
    expect(track).toHaveBeenCalledWith('transit', 'live_select', expect.objectContaining({ kind: 'vehicle', source: 'map' }));
  });

  it('seeds the line filter from the query string', async () => {
    const m = await render('/transit/live?line=205');
    expect(m.container.querySelector('[data-testid="vehicle-v2"]')).not.toBeNull();
    expect(m.container.querySelector('[data-testid="vehicle-v1"]')).toBeNull();
    expect(track).toHaveBeenCalledWith('transit', 'live_filter', expect.objectContaining({ source: 'deep_link', line: '205' }));
  });
});
