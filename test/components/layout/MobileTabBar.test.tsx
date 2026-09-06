// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  fetchBootstrap: vi.fn(),
}));
vi.mock('@/lib/api', () => api);

import { MobileTabBar } from '@/components/layout/MobileTabBar';
import i18n from '@/lib/i18n';
import { flush, mount, type Mounted } from '../../helpers/react';

await i18n.changeLanguage('en');

let mounted: Mounted | null = null;

async function render() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  mounted = await mount(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <MobileTabBar />
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
  api.fetchBootstrap.mockReset();
});

afterEach(async () => {
  await mounted?.unmount();
  mounted = null;
});

describe('MobileTabBar', () => {
  // `transit` and `events` ship enabled at the build level (`staticIslandConfig`)
  // regardless of what bootstrap reports, so they're always present here.
  it('shows Início plus the fixed modules that are enabled, in order', async () => {
    api.fetchBootstrap.mockResolvedValue({ island: { enabledModules: ['transit', 'minibus', 'weather', 'news'] } });
    const m = await render();
    const links = Array.from(m.container.querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(links).toEqual(['/hub', '/transit', '/tours', '/minibus', '/weather']);
  });

  it('omits a fixed module the island has not enabled', async () => {
    api.fetchBootstrap.mockResolvedValue({ island: { enabledModules: [] } });
    const m = await render();
    const links = Array.from(m.container.querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(links).toEqual(['/hub', '/transit', '/tours']);
  });
});
