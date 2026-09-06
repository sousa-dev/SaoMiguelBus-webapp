// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/analytics', () => ({ track: vi.fn() }));
const api = vi.hoisted(() => ({
  fetchMinibusTariffs: vi.fn(),
}));
vi.mock('@/lib/api', () => api);

import { MinibusPricesPage } from '@/features/minibus/MinibusPricesPage';
import i18n from '@/lib/i18n';
import { flush, mount, type Mounted } from '../../helpers/react';

await i18n.changeLanguage('en');

let mounted: Mounted | null = null;

async function render() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  mounted = await mount(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <MinibusPricesPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  await flush();
  return mounted;
}

beforeEach(() => {
  api.fetchMinibusTariffs.mockReset();
  api.fetchMinibusTariffs.mockResolvedValue({
    tariffs: [{ key: 'single', label: 'Single ticket', price_eur: '0.50', sort_order: 1 }],
    tariffs_effective_date: '2021-11-28',
    attribution: 'PDL',
    source_url: 'https://pdlminibus.pt',
  });
});

afterEach(async () => {
  await mounted?.unmount();
  mounted = null;
});

describe('MinibusPricesPage', () => {
  it('renders the tariff table', async () => {
    const m = await render();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
    });
    expect(m.container.textContent).toContain('Single ticket');
    expect(m.container.textContent).toContain('€0.50');
  });
});
