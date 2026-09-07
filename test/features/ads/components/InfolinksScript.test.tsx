// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { InfolinksScript } from '@/features/ads/components/InfolinksScript';
import { readWebAdConfig, setWebAdConfigForTests } from '@/features/ads/providers/config';
import { resetScriptLoaderForTests } from '@/features/ads/providers/script-loader';
import { setPremiumForTests } from '@/features/premium/usePremium';
import { useConsentStore } from '@/lib/consent-store';
import { flush, mount, type Mounted } from '../../../helpers/react';

const allPurposes = { strictly_necessary: true, analytics: true, ads: true, personalization: true };

let mounted: Mounted | null = null;

function scripts(): HTMLScriptElement[] {
  return Array.from(document.querySelectorAll('script'));
}

beforeEach(() => {
  resetScriptLoaderForTests();
  document.head.innerHTML = '';
  delete window.infolinks_pid;
  delete window.infolinks_wsid;
  setPremiumForTests(null);
  useConsentStore.setState({ decided: true, purposes: allPurposes });
});

afterEach(async () => {
  await mounted?.unmount();
  mounted = null;
  setWebAdConfigForTests(null);
});

describe('InfolinksScript', () => {
  it('loads the Infolinks script once a pid is configured and consent allows ads', async () => {
    setWebAdConfigForTests(readWebAdConfig({ VITE_INFOLINKS_PID: '3447644', VITE_INFOLINKS_WSID: '0' }));
    mounted = await mount(<InfolinksScript />);
    await flush();
    expect(window.infolinks_pid).toBe(3447644);
    expect(scripts()).toHaveLength(1);
  });

  it('does nothing when no pid is configured', async () => {
    setWebAdConfigForTests(readWebAdConfig({}));
    mounted = await mount(<InfolinksScript />);
    await flush();
    expect(scripts()).toHaveLength(0);
  });

  it('does nothing while consent is undecided', async () => {
    setWebAdConfigForTests(readWebAdConfig({ VITE_INFOLINKS_PID: '3447644' }));
    useConsentStore.setState({ decided: false, purposes: allPurposes });
    mounted = await mount(<InfolinksScript />);
    await flush();
    expect(scripts()).toHaveLength(0);
  });

  it('does nothing for premium users', async () => {
    setWebAdConfigForTests(readWebAdConfig({ VITE_INFOLINKS_PID: '3447644' }));
    setPremiumForTests({
      tier: 'premium',
      source: 'revenuecat',
      status: 'active',
      currentPeriodEnd: null,
      features: [],
      manageVia: 'web',
    });
    mounted = await mount(<InfolinksScript />);
    await flush();
    expect(scripts()).toHaveLength(0);
  });
});
