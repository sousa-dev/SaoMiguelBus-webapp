// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { track } = vi.hoisted(() => ({ track: vi.fn() }));
vi.mock('@/lib/analytics', () => ({ track }));
const api = vi.hoisted(() => ({ fetchLiveVehicleCounts: vi.fn() }));
vi.mock('@/lib/api', () => api);

import { LiveEntryCard } from '@/features/transit/live/components/LiveEntryCard';
import i18n from '@/lib/i18n';
import { flush, mount, type Mounted } from '../../../helpers/react';

await i18n.changeLanguage('en');

let mounted: Mounted | null = null;

function Where() {
  const location = useLocation();
  return <span data-testid="where">{location.pathname}</span>;
}

async function render(props: { showTracking?: boolean; online?: boolean } = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  mounted = await mount(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/transit']}>
        <LiveEntryCard showTracking={props.showTracking ?? true} isOnline={props.online ?? true} />
        <Where />
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
  track.mockClear();
  api.fetchLiveVehicleCounts.mockReset();
  api.fetchLiveVehicleCounts.mockResolvedValue({
    azoresbus: { status: 'ok', vehicles: 23, recordedAt: '2026-09-06T10:00:00Z' },
    minibus: null,
    ttlSeconds: 60,
  });
});

afterEach(async () => {
  await mounted?.unmount();
  mounted = null;
});

describe('LiveEntryCard', () => {
  it('shows the live vehicle count and opens the live map', async () => {
    const m = await render();
    expect(m.container.textContent).toContain('23');
    await act(async () => {
      m.container.querySelector('a')!.click();
    });
    expect(m.container.querySelector('[data-testid="where"]')!.textContent).toBe('/transit/live');
    expect(track).toHaveBeenCalledWith('transit', 'live_entry_open', { source: 'transit_hub' });
  });

  it('is greyed with an offline caption when the browser is offline', async () => {
    const m = await render({ online: false });
    expect(m.container.textContent).toContain('Offline');
    expect(m.container.querySelector('a')!.getAttribute('aria-disabled')).toBe('true');
  });

  it('is greyed when the feed is recorded as unavailable, and hidden when the feature is off', async () => {
    api.fetchLiveVehicleCounts.mockResolvedValue({
      azoresbus: { status: 'unavailable', vehicles: null, recordedAt: null },
      minibus: null,
      ttlSeconds: 60,
    });
    let m = await render();
    expect(m.container.querySelector('a')!.getAttribute('aria-disabled')).toBe('true');
    await m.unmount();

    m = await render({ showTracking: false });
    expect(m.container.querySelector('a')).toBeNull();
  });
});
