// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/analytics', () => ({ track: vi.fn() }));
const api = vi.hoisted(() => ({
  fetchMinibusLines: vi.fn(),
  fetchMinibusNetwork: vi.fn(),
  fetchMinibusRoute: vi.fn(),
}));
vi.mock('@/lib/api', () => api);

import { MinibusSearchPage } from '@/features/minibus/MinibusSearchPage';
import i18n from '@/lib/i18n';
import { flush, mount, type Mounted } from '../../helpers/react';

await i18n.changeLanguage('en');

const lines = [
  { code: 'A', slug: 'line-a', name: 'Linha A', color: 'fbc707', sort_order: 1, service_summary: {} },
];
const network = { interchanges_by_key: {}, lines: [{ code: 'A', slug: 'line-a', name: 'Linha A', color: 'fbc707', direction: 'circular', stop_count: 0, stops: [] }] };

let mounted: Mounted | null = null;

async function render() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  mounted = await mount(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <MinibusSearchPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  for (let i = 0; i < 3; i++) await flush();
  return mounted;
}

beforeEach(() => {
  api.fetchMinibusLines.mockReset();
  api.fetchMinibusNetwork.mockReset();
  api.fetchMinibusRoute.mockReset();
  api.fetchMinibusLines.mockResolvedValue({ lines });
  api.fetchMinibusNetwork.mockResolvedValue(network);
});

afterEach(async () => {
  await mounted?.unmount();
  mounted = null;
});

describe('MinibusSearchPage', () => {
  it('renders the planner with a disabled search button until both stops are filled', async () => {
    const m = await render();
    const searchBtn = Array.from(m.container.querySelectorAll('button')).find((b) => b.textContent === 'Search') as HTMLButtonElement;
    expect(searchBtn.disabled).toBe(true);
  });

  it('shows a "no journeys" message when the search returns nothing', async () => {
    api.fetchMinibusRoute.mockResolvedValue({
      origin: { query: 'A', name: 'A', matched: false },
      destination: { query: 'B', name: 'B', matched: false },
      journeys: [],
    });
    const m = await render();
    const inputs = m.container.querySelectorAll('input[placeholder]');
    const setValue = (el: HTMLInputElement, value: string) => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
      setter.call(el, value);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };
    await act(async () => {
      setValue(inputs[0] as HTMLInputElement, 'A');
      setValue(inputs[1] as HTMLInputElement, 'B');
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
    expect(m.container.textContent).toContain('No route found');
  });
});
