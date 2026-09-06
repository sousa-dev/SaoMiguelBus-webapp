// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/analytics', () => ({ track: vi.fn() }));
const api = vi.hoisted(() => ({
  fetchBootstrap: vi.fn(async () => ({ island: { enabledModules: ['transit', 'minibus'] }, transitSchedule: null })),
  fetchMinibusLines: vi.fn(),
  fetchMinibusNetwork: vi.fn(),
  fetchMinibusRoute: vi.fn(),
  fetchLiveVehicleCounts: vi.fn(async () => ({ transit: null, minibus: null })),
  fetchAd: vi.fn(async () => null),
}));
vi.mock('@/lib/api', () => api);
vi.mock('@/features/ads/components/AdBanner', () => ({ AdBanner: () => null }));

import { MinibusPage } from '@/features/minibus/MinibusPage';
import i18n from '@/lib/i18n';
import { flush, mount, type Mounted } from '../../helpers/react';

await i18n.changeLanguage('en');

const lines = [
  { code: 'A', slug: 'line-a', name: 'Linha A', color: 'fbc707', sort_order: 1, service_summary: {} },
];
const network = {
  interchanges_by_key: {},
  lines: [
    {
      code: 'A',
      slug: 'line-a',
      name: 'Linha A',
      color: 'fbc707',
      direction: 'circular',
      stop_count: 2,
      stops: [
        {
          sequence: 1,
          key: 'a-01',
          name_pt: 'Portas do Mar',
          match_key: 'a-01',
          interchange_key: 'a-01',
          interchange_lines: [],
          latitude: 37.74,
          longitude: -25.66,
        },
        {
          sequence: 2,
          key: 'a-02',
          name_pt: 'Hospital',
          match_key: 'a-02',
          interchange_key: 'a-02',
          interchange_lines: [],
          latitude: 37.75,
          longitude: -25.65,
        },
      ],
    },
  ],
};

let mounted: Mounted | null = null;

async function render() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  mounted = await mount(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <MinibusPage />
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
  api.fetchMinibusLines.mockReset();
  api.fetchMinibusNetwork.mockReset();
  api.fetchMinibusRoute.mockReset();
  api.fetchMinibusLines.mockResolvedValue({ lines, source_url: 'https://pdlminibus.pt', imported_at: null });
  api.fetchMinibusNetwork.mockResolvedValue(network);
});

afterEach(async () => {
  await mounted?.unmount();
  mounted = null;
});

describe('MinibusPage', () => {
  it('shows the network map + live row, the inline planner, and pre-search shortcuts', async () => {
    const m = await render();
    const text = m.container.textContent ?? '';
    expect(m.container.querySelectorAll('input[placeholder]').length).toBeGreaterThanOrEqual(2);
    expect(text).toContain('2 stops');
    expect(text).toContain('Fares');
    expect(text).toContain('Looking for AzoresBus schedules?');
  });

  it('hides the pre-search shortcuts and shows results once a search runs', async () => {
    api.fetchMinibusRoute.mockResolvedValue({
      origin: { query: 'Portas do Mar', name: 'Portas do Mar', matched: true },
      destination: { query: 'Hospital', name: 'Hospital', matched: true },
      journeys: [
        {
          transfers: 0,
          total_stops: 2,
          transfer_stops: [],
          legs: [
            {
              line_code: 'A',
              line_slug: 'line-a',
              line_name: 'Linha A',
              line_color: '#fbc707',
              board: { key: 'a-01', name: 'Portas do Mar', line_code: 'A', sequence: 1 },
              alight: { key: 'a-02', name: 'Hospital', line_code: 'A', sequence: 2 },
              stops: [],
              num_stops: 2,
              departure_time: null,
              arrival_time: null,
            },
          ],
        },
      ],
    });

    const m = await render();
    const inputs = m.container.querySelectorAll('input[placeholder]');
    const setValue = (el: HTMLInputElement, value: string) => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
      setter.call(el, value);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };
    await act(async () => {
      setValue(inputs[0] as HTMLInputElement, 'Portas do Mar');
      setValue(inputs[1] as HTMLInputElement, 'Hospital');
    });
    const searchBtn = Array.from(m.container.querySelectorAll('button')).find((b) => b.textContent === 'Search')!;
    await act(async () => {
      searchBtn.click();
    });
    for (let i = 0; i < 4; i++) {
      await flush();
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));
      });
    }

    expect(m.container.textContent).toContain('Direct');
    expect(m.container.textContent).not.toContain('Looking for AzoresBus schedules?');
  });
});
