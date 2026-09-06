// @vitest-environment jsdom
import { act } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { HeaderActions } from '@/components/layout/HeaderActions';
import { useAuthStore } from '@/features/account/auth-store';
import { useSignInDialogStore } from '@/features/account/lib/sign-in-dialog-store';
import { setPremiumForTests } from '@/features/premium/usePremium';
import i18n from '@/lib/i18n';
import { mount, type Mounted } from '../helpers/react';

await i18n.changeLanguage('en');

const user = { id: 7, email: 'a@b.c', displayName: 'Ana', dateJoined: '2026-01-01' };
let mounted: Mounted | null = null;

async function render() {
  mounted = await mount(
    <MemoryRouter>
      <HeaderActions />
    </MemoryRouter>,
  );
  return mounted;
}

function links(): Array<{ href: string; text: string }> {
  return Array.from(mounted!.container.querySelectorAll('a')).map((a) => ({
    href: a.getAttribute('href') ?? '',
    text: a.textContent ?? '',
  }));
}

beforeEach(() => {
  useAuthStore.setState({ token: null, user: null, hydrated: true });
  useSignInDialogStore.getState().close();
  setPremiumForTests(null);
});

afterEach(async () => {
  await mounted?.unmount();
  mounted = null;
});

describe('HeaderActions', () => {
  it('sends free users to the paywall and premium users to settings', async () => {
    await render();
    expect(links().some((l) => l.href === '/premium?source=header' && l.text.includes('Remove Ads'))).toBe(
      true,
    );

    setPremiumForTests({
      tier: 'premium',
      source: 'revenuecat',
      status: 'active',
      currentPeriodEnd: null,
      features: [],
      manageVia: 'web',
    });
    await mounted!.rerender(
      <MemoryRouter>
        <HeaderActions />
      </MemoryRouter>,
    );
    expect(links().some((l) => l.href === '/premium?source=header')).toBe(false);
    expect(links().some((l) => l.href === '/settings' && l.text.includes('Premium'))).toBe(true);
  });

  it('opens the sign-in dialog for anonymous users and links to settings when signed in', async () => {
    await render();
    const accountButton = mounted!.container.querySelector<HTMLButtonElement>(
      'button[data-testid="header-account"]',
    )!;
    await act(async () => {
      accountButton.click();
    });
    expect(useSignInDialogStore.getState().open).toBe(true);

    useAuthStore.setState({ token: 'tok', user });
    await mounted!.rerender(
      <MemoryRouter>
        <HeaderActions />
      </MemoryRouter>,
    );
    expect(mounted!.container.querySelector('a[data-testid="header-account"]')?.getAttribute('href')).toBe(
      '/settings',
    );
    expect(links().some((l) => l.href === '/settings' && l.text === '')).toBe(false); // has a label
  });
});
