// @vitest-environment jsdom
import { act } from 'react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PremiumGateDialogHost } from '@/features/premium/components/PremiumGateDialogHost';
import { usePremiumGate } from '@/features/premium/hooks/usePremiumGate';
import { usePremiumGateDialogStore } from '@/features/premium/lib/premium-gate-dialog-store';
import { setPremiumForTests } from '@/features/premium/usePremium';
import { mount, type Mounted } from '../../helpers/react';

vi.mock('@/lib/analytics', () => ({ track: vi.fn() }));
const i18n = (await import('@/lib/i18n')).default;
await i18n.changeLanguage('en');

let mounted: Mounted | null = null;
const action = vi.fn();

function Probe() {
  const { isPremium, guardPremiumAction } = usePremiumGate();
  const location = useLocation();
  return (
    <div>
      <span data-testid="where">{location.pathname + location.search}</span>
      <span data-testid="premium">{String(isPremium)}</span>
      <button type="button" onClick={() => guardPremiumAction(action, 'track_start', 'track')}>
        go
      </button>
    </div>
  );
}

function gateDialog(): HTMLElement | null {
  return document.body.querySelector('[role="dialog"]');
}

beforeEach(() => {
  action.mockClear();
  setPremiumForTests(null);
  usePremiumGateDialogStore.getState().close();
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
        <PremiumGateDialogHost />
      </MemoryRouter>,
    );
    await act(async () => {
      mounted!.container.querySelector('button')!.click();
    });
    expect(action).toHaveBeenCalledTimes(1);
    expect(mounted.container.querySelector('[data-testid="where"]')!.textContent).toBe('/transit');
  });

  it('explains the feature to free users first, then Continue lands on the paywall with the source', async () => {
    mounted = await mount(
      <MemoryRouter initialEntries={['/transit']}>
        <Probe />
        <PremiumGateDialogHost />
      </MemoryRouter>,
    );
    await act(async () => {
      mounted!.container.querySelector('button')!.click();
    });
    expect(action).not.toHaveBeenCalled();
    expect(mounted.container.querySelector('[data-testid="where"]')!.textContent).toBe('/transit');
    const dialog = gateDialog()!;
    expect(dialog).not.toBeNull();
    expect(dialog.textContent).toContain('Track this bus');
    expect(dialog.textContent).toContain('Premium feature');

    const continueButton = Array.from(dialog.querySelectorAll('button')).find((b) => b.textContent === 'Continue')!;
    await act(async () => {
      continueButton.click();
    });
    expect(gateDialog()).toBeNull();
    expect(action).not.toHaveBeenCalled();
    expect(mounted.container.querySelector('[data-testid="where"]')!.textContent).toBe(
      '/premium?source=track_start',
    );
  });
});
