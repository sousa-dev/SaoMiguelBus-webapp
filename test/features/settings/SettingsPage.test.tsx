// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  loginAccount: vi.fn(),
  registerAccount: vi.fn(),
  fetchMe: vi.fn(),
  logoutAccount: vi.fn(),
  deleteAccount: vi.fn(),
  fetchEntitlement: vi.fn(),
  fetchBootstrap: vi.fn(async () => ({ island: { enabledModules: ['transit'] } })),
}));
vi.mock('@/lib/api', () => api);

import { useAuthStore } from '@/features/account/auth-store';
import { setPremiumForTests } from '@/features/premium/usePremium';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { useConsentStore } from '@/lib/consent-store';
import i18n from '@/lib/i18n';
import { mount, type Mounted } from '../../helpers/react';

await i18n.changeLanguage('en');

let mounted: Mounted | null = null;

async function render() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  mounted = await mount(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/settings']}>
        <SettingsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return mounted;
}

beforeEach(() => {
  useAuthStore.setState({ token: null, user: null, hydrated: true });
  setPremiumForTests(null);
  useConsentStore.setState({ decided: true });
});

afterEach(async () => {
  await mounted?.unmount();
  mounted = null;
});

describe('SettingsPage', () => {
  it('renders the account, premium, language, privacy and about sections', async () => {
    const m = await render();
    const text = m.container.textContent ?? '';
    for (const label of ['Account', 'Premium', 'Language', 'Privacy', 'About', 'Version']) {
      expect(text, label).toContain(label);
    }
    expect(text).toContain('No active subscription');
  });

  it('re-opens the consent banner from the privacy section', async () => {
    const m = await render();
    const manage = Array.from(m.container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Manage consent choices'),
    )!;
    await act(async () => {
      manage.click();
    });
    expect(useConsentStore.getState().decided).toBe(false);
  });
});
