// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/analytics', () => ({ track: vi.fn() }));
const api = vi.hoisted(() => ({
  fetchMinibusNetwork: vi.fn(),
  fetchMinibusLines: vi.fn(),
  getApiBase: vi.fn(() => 'https://api.test'),
}));
vi.mock('@/lib/api', () => api);
vi.mock('@/components/MapView', () => ({
  MapView: ({ points }: { points: Array<{ id: string; onClick?: () => void }> }) => (
    <div data-testid="map">
      {points.map((p) => (
        <button key={p.id} type="button" data-testid={`pin-${p.id}`} onClick={p.onClick}>
          {p.id}
        </button>
      ))}
    </div>
  ),
}));

import { MinibusNetworkPage } from '@/features/minibus/MinibusNetworkPage';
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
          name_pt: 'Mercado da Graça',
          match_key: 'a-02',
          interchange_key: 'a-02',
          interchange_lines: [],
          latitude: 37.741,
          longitude: -25.661,
        },
      ],
    },
  ],
};

function setInputValue(el: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
  setter.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

let mounted: Mounted | null = null;

async function render() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  mounted = await mount(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <MinibusNetworkPage />
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
  api.fetchMinibusNetwork.mockReset();
  api.fetchMinibusLines.mockReset();
  api.fetchMinibusNetwork.mockResolvedValue(network);
  api.fetchMinibusLines.mockResolvedValue({ lines });
});

afterEach(async () => {
  await mounted?.unmount();
  mounted = null;
});

describe('MinibusNetworkPage', () => {
  it('lists every stop and narrows the list on search', async () => {
    const m = await render();
    expect(m.container.textContent).toContain('Portas do Mar');
    expect(m.container.textContent).toContain('Mercado da Graça');

    const input = m.container.querySelector('input')!;
    await act(async () => {
      setInputValue(input, 'Mercado');
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
    });
    expect(m.container.textContent).toContain('Mercado da Graça');
    expect(m.container.textContent).not.toContain('Portas do Mar');
  });

  it('focuses a stop on the first tap and opens the lines dialog on the second', async () => {
    const m = await render();
    const row = Array.from(m.container.querySelectorAll('li button')).find((b) =>
      b.textContent?.includes('Portas do Mar'),
    ) as HTMLButtonElement;

    await act(async () => {
      row.click();
    });
    expect(m.container.textContent).toContain('2/2');
    expect(document.body.querySelector('[role="dialog"]')).toBeNull();

    await act(async () => {
      row.click();
    });
    const dialog = document.body.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog!.textContent).toContain('Portas do Mar');
    expect(dialog!.textContent).toContain('A');
  });

  it('switches to the Lines tab to show the schematic image and the line list', async () => {
    const m = await render();
    const linesTab = Array.from(m.container.querySelectorAll('button')).find((b) => b.textContent === 'Lines')!;
    await act(async () => {
      linesTab.click();
    });
    expect(m.container.querySelector('[data-testid="map"]')).toBeNull();
    expect(m.container.querySelector('img')).not.toBeNull();
    expect(m.container.textContent).toContain('Linha A');
  });

  it('says when nothing matches the search', async () => {
    const m = await render();
    const input = m.container.querySelector('input')!;
    await act(async () => {
      setInputValue(input, 'zzz-no-match');
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
    });
    expect(m.container.textContent).toContain('No stops match your search.');
  });
});
