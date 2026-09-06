import { afterEach, describe, expect, it, vi } from 'vitest';

import i18n from '@/lib/i18n';
import { postAnalyticsEvents } from '@/lib/api';

describe('postAnalyticsEvents locale', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends the active i18n language as the batch locale', async () => {
    await i18n.changeLanguage('en');

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ accepted: 1, dropped: 0 }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await postAnalyticsEvents('session-1', [
      { module: 'transit', event_type: 'load' },
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.locale).toBe('en');
  });
});
