// @vitest-environment jsdom
import { act } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/analytics', () => ({ track: vi.fn() }));
vi.mock('@/components/MapView', () => ({ MapView: () => <div data-testid="map" /> }));

import { MinibusDirectionsPage } from '@/features/minibus/MinibusDirectionsPage';
import { setPendingDirections } from '@/features/minibus/lib/directions-store';
import i18n from '@/lib/i18n';
import type { MinibusJourney, MinibusStopRef } from '@/lib/types';
import { flush, mount, type Mounted } from '../../helpers/react';

await i18n.changeLanguage('en');

function stopRef(overrides: Partial<MinibusStopRef> & { key: string; name: string; sequence: number }): MinibusStopRef {
  return { line_code: 'A', latitude: 37.7, longitude: -25.6, ...overrides };
}

const journey: MinibusJourney = {
  transfers: 0,
  total_stops: 3,
  transfer_stops: [],
  legs: [
    {
      line_code: 'A',
      line_slug: 'line-a',
      line_name: 'Linha Amarela',
      line_color: '#fbc707',
      board: stopRef({ key: 'a-01', name: 'Portas do Mar', sequence: 1, latitude: 37.74, longitude: -25.66 }),
      alight: stopRef({ key: 'a-03', name: 'Hospital', sequence: 3, latitude: 37.75, longitude: -25.65 }),
      stops: [
        stopRef({ key: 'a-01', name: 'Portas do Mar', sequence: 1, latitude: 37.74, longitude: -25.66 }),
        stopRef({ key: 'a-02', name: 'Mercado', sequence: 2, latitude: 37.745, longitude: -25.655 }),
        stopRef({ key: 'a-03', name: 'Hospital', sequence: 3, latitude: 37.75, longitude: -25.65 }),
      ],
      num_stops: 3,
      departure_time: null,
      arrival_time: null,
    },
  ],
};

let mounted: Mounted | null = null;

async function render() {
  mounted = await mount(
    <MemoryRouter>
      <MinibusDirectionsPage />
    </MemoryRouter>,
  );
  await flush();
  return mounted;
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(async () => {
  await mounted?.unmount();
  mounted = null;
});

describe('MinibusDirectionsPage', () => {
  it('shows an empty state with no pending journey', async () => {
    const m = await render();
    expect(m.container.textContent).toContain('No route found');
  });

  it('renders the steps and map for a pending journey, highlighting a tapped step', async () => {
    setPendingDirections(journey);
    const m = await render();
    expect(m.container.querySelector('[data-testid="map"]')).not.toBeNull();
    expect(m.container.textContent).toContain('Board at Portas do Mar (Line Amarela)');
    expect(m.container.textContent).toContain('Get off at Hospital (Line Amarela)');

    const boardButton = Array.from(m.container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Board at Portas do Mar'),
    ) as HTMLButtonElement;
    await act(async () => {
      boardButton.click();
    });
    expect(boardButton.className).toContain('bg-surface-variant');
  });
});
