// @vitest-environment jsdom
import { act } from 'react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { usePremiumGate } from '@/features/premium/hooks/usePremiumGate';
import { setPremiumForTests } from '@/features/premium/usePremium';
import { mount, type Mounted } from '../../helpers/react';

let mounted: Mounted | null = null;
const action = vi.fn();

function Probe() {
  const { isPremium, guardPremiumAction } = usePremiumGate();
  const location = useLocation();
  return (
    <div>
      <span data-testid="where">{location.pathname + location.search}</span>
      <span data-testid="premium">{String(isPremium)}</span>
      <button type="button" onClick={() => guardPremiumAction(action, 'track_start')}>
        go
      </button>
    </div>
  );
}

beforeEach(() => {
  action.mockClear();
  setPremiumForTests(null);
});

afterEach(async () => {
  await mounted?.unmount();
  mounted = null;
});

describe('usePremiumGate', () => {
  it('runs the action for premium users', async () => {
    setPremiumForTests({
      tier: 'premium',
      source: 'revenuecat',
      status: 'active',
      currentPeriodEnd: null,
      features: [],
      manageVia: 'web',
    });
    mounted = await mount(
      <MemoryRouter initialEntries={['/transit']}>
        <Probe />
      </MemoryRouter>,
    );
    await act(async () => {
      mounted!.container.querySelector('button')!.click();
    });
    expect(action).toHaveBeenCalledTimes(1);
    expect(mounted.container.querySelector('[data-testid="where"]')!.textContent).toBe('/transit');
  });

  it('sends free users to the paywall with the source instead', async () => {
    mounted = await mount(
      <MemoryRouter initialEntries={['/transit']}>
        <Probe />
      </MemoryRouter>,
    );
    await act(async () => {
      mounted!.container.querySelector('button')!.click();
    });
    expect(action).not.toHaveBeenCalled();
    expect(mounted.container.querySelector('[data-testid="where"]')!.textContent).toBe(
      '/premium?source=track_start',
    );
  });
});
