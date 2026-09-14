// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/analytics', () => ({ track: vi.fn() }));
const api = vi.hoisted(() => ({
  fetchBootstrap: vi.fn(async () => ({
    island: { enabledModules: ['transit'] },
    holidays: [],
    transitSchedule: {
      activeDataset: 'azoresbus',
      previewDataset: null,
      cutoverAt: null,
      nextTransitionAt: null,
      phase: 'settled',
      banner: null,
      badge: null,
      trackingEnabled: false,
    },
  })),
  fetchStops: vi.fn(async () => []),
  fetchLiveVehicleCounts: vi.fn(async () => ({ azoresbus: null, minibus: null, ttlSeconds: 60 })),
  fetchAd: vi.fn(async () => null),
  fetchEntitlement: vi.fn(async () => ({ tier: 'free' })),
  searchTransitJourneys: vi.fn(async () => ({ journeys: [] })),
}));
vi.mock('@/lib/api', () => api);

import { FavoriteSearchesButton } from '@/features/transit/components/FavoriteSearchesDialog';
import { TransitPage } from '@/features/transit/TransitPage';
import i18n from '@/lib/i18n';
import { useProfileStore } from '@/lib/store';
import { flush, mount, type Mounted } from '../../helpers/react';

await i18n.changeLanguage('en');

let mounted: Mounted | null = null;

function findButton(label: string): HTMLButtonElement {
  const match = [...document.body.querySelectorAll('button')].find((b) =>
    b.textContent?.includes(label),
  );
  if (!match) throw new Error(`no button containing "${label}"`);
  return match as HTMLButtonElement;
}

async function click(element: HTMLElement) {
  await act(async () => {
    element.click();
  });
  await flush();
}

function dialog(): HTMLElement | null {
  return document.body.querySelector('[role="dialog"]');
}

beforeEach(() => {
  localStorage.clear();
  // jsdom has no layout, so the planner's scroll-back is a no-op here.
  Element.prototype.scrollIntoView = vi.fn();
  useProfileStore.setState({ favoriteRoutes: [], recentSearches: [] });
});

afterEach(async () => {
  await mounted?.unmount();
  mounted = null;
});

describe('FavoriteSearchesButton', () => {
  it('opens a dialog listing the saved searches', async () => {
    useProfileStore.setState({
      favoriteRoutes: [
        { origin: 'Ponta Delgada', destination: 'Ribeira Grande' },
        { origin: 'Furnas', destination: 'Nordeste' },
      ],
    });
    mounted = await mount(<FavoriteSearchesButton onSelect={() => {}} />);

    expect(dialog()).toBeNull();
    await click(findButton('Favorite Searches'));

    const open = dialog();
    expect(open).not.toBeNull();
    expect(open?.textContent).toContain('Ponta Delgada');
    expect(open?.textContent).toContain('Ribeira Grande');
    expect(open?.textContent).toContain('Furnas');
    expect(open?.textContent).toContain('Nordeste');
  });

  it('reports the picked route and closes the dialog', async () => {
    useProfileStore.setState({
      favoriteRoutes: [{ origin: 'Ponta Delgada', destination: 'Ribeira Grande' }],
    });
    const onSelect = vi.fn();
    mounted = await mount(<FavoriteSearchesButton onSelect={onSelect} />);

    await click(findButton('Favorite Searches'));
    const row = [...(dialog()?.querySelectorAll('button') ?? [])].find((b) =>
      b.textContent?.includes('Ribeira Grande'),
    );
    await click(row as HTMLButtonElement);

    expect(onSelect).toHaveBeenCalledWith('Ponta Delgada', 'Ribeira Grande');
    expect(dialog()).toBeNull();
  });

  it('offers the return trip alongside the saved one', async () => {
    useProfileStore.setState({
      favoriteRoutes: [{ origin: 'Ponta Delgada', destination: 'Ribeira Grande' }],
    });
    const onSelect = vi.fn();
    mounted = await mount(<FavoriteSearchesButton onSelect={onSelect} />);

    await click(findButton('Favorite Searches'));
    const reverse = [...(dialog()?.querySelectorAll('button') ?? [])].find(
      (b) => b.getAttribute('aria-label') === 'Ribeira Grande → Ponta Delgada',
    );
    expect(reverse).toBeTruthy();
    await click(reverse as HTMLButtonElement);

    expect(onSelect).toHaveBeenCalledWith('Ribeira Grande', 'Ponta Delgada');
  });

  it('asks before removing, and keeps the route if the rider backs out', async () => {
    useProfileStore.setState({
      favoriteRoutes: [{ origin: 'Ponta Delgada', destination: 'Ribeira Grande' }],
    });
    mounted = await mount(<FavoriteSearchesButton onSelect={() => {}} />);
    await click(findButton('Favorite Searches'));

    const remove = [...(dialog()?.querySelectorAll('button') ?? [])].find(
      (b) => b.getAttribute('aria-label') === 'Remove from Favorites',
    );
    await click(remove as HTMLButtonElement);

    // Nothing is gone yet — the rider is being asked first.
    expect(useProfileStore.getState().favoriteRoutes).toHaveLength(1);
    expect(document.body.textContent).toContain('from your favorites?');

    await click(findButton('Cancel'));
    expect(useProfileStore.getState().favoriteRoutes).toHaveLength(1);
  });

  it('removes the route once the rider confirms', async () => {
    useProfileStore.setState({
      favoriteRoutes: [{ origin: 'Ponta Delgada', destination: 'Ribeira Grande' }],
    });
    mounted = await mount(<FavoriteSearchesButton onSelect={() => {}} />);
    await click(findButton('Favorite Searches'));

    const remove = [...(dialog()?.querySelectorAll('button') ?? [])].find(
      (b) => b.getAttribute('aria-label') === 'Remove from Favorites',
    );
    await click(remove as HTMLButtonElement);
    await click(findButton('Remove from Favorites'));

    expect(useProfileStore.getState().favoriteRoutes).toHaveLength(0);
  });

  it('counts the saved searches on the button', async () => {
    useProfileStore.setState({
      favoriteRoutes: [
        { origin: 'Ponta Delgada', destination: 'Ribeira Grande' },
        { origin: 'Furnas', destination: 'Nordeste' },
        { origin: 'Lagoa', destination: 'Vila Franca' },
      ],
    });
    mounted = await mount(<FavoriteSearchesButton onSelect={() => {}} />);

    expect(findButton('Favorite Searches').textContent).toContain('3');
  });

  it('counts zero rather than hiding the counter', async () => {
    mounted = await mount(<FavoriteSearchesButton onSelect={() => {}} />);

    expect(findButton('Favorite Searches').textContent).toContain('0');
  });

  it('tells the rider when nothing is saved yet', async () => {
    mounted = await mount(<FavoriteSearchesButton onSelect={() => {}} />);

    await click(findButton('Favorite Searches'));

    expect(dialog()?.textContent).toContain('No favorite searches');
  });
});

describe('TransitPage favourites', () => {
  async function renderPage() {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    mounted = await mount(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/transit']}>
          <TransitPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    for (let i = 0; i < 5; i++) await flush();
    return mounted;
  }

  it('runs the search on pick, exactly as pressing Search does', async () => {
    useProfileStore.setState({
      favoriteRoutes: [{ origin: 'Ponta Delgada', destination: 'Ribeira Grande' }],
    });
    await renderPage();
    api.searchTransitJourneys.mockClear();

    await click(findButton('Favorite Searches'));
    const row = [...(dialog()?.querySelectorAll('button') ?? [])].find((b) =>
      b.textContent?.includes('Ribeira Grande'),
    );
    await click(row as HTMLButtonElement);

    expect(api.searchTransitJourneys).toHaveBeenCalledWith(
      expect.objectContaining({ origin: 'Ponta Delgada', destination: 'Ribeira Grande' }),
    );
  });

  it('prefills the empty planner from a favourite', async () => {
    useProfileStore.setState({
      favoriteRoutes: [{ origin: 'Ponta Delgada', destination: 'Ribeira Grande' }],
    });
    const m = await renderPage();

    const inputs = () => [...m.container.querySelectorAll('input[role="combobox"]')] as HTMLInputElement[];
    expect(inputs()[0]?.value).toBe('');

    await click(findButton('Favorite Searches'));
    const row = [...(dialog()?.querySelectorAll('button') ?? [])].find((b) =>
      b.textContent?.includes('Ribeira Grande'),
    );
    await click(row as HTMLButtonElement);

    expect(inputs()[0]?.value).toBe('Ponta Delgada');
    expect(inputs()[1]?.value).toBe('Ribeira Grande');
  });
});
