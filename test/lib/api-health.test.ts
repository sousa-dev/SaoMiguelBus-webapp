// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchAzoresbusTrackingHealth } from '@/lib/api';

afterEach(() => {
  vi.unstubAllGlobals();
});

function respond(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  });
}

describe('fetchAzoresbusTrackingHealth', () => {
  it('passes a healthy or disabled verdict through', async () => {
    vi.stubGlobal('fetch', respond(200, { status: 'ok', vehicles: 12 }));
    expect(await fetchAzoresbusTrackingHealth()).toEqual({ status: 'ok', vehicles: 12 });
    vi.stubGlobal('fetch', respond(200, { status: 'disabled', vehicles: 0 }));
    expect(await fetchAzoresbusTrackingHealth()).toEqual({ status: 'disabled', vehicles: 0 });
  });

  it('turns the 502 outage answer into an unavailable verdict instead of throwing', async () => {
    vi.stubGlobal('fetch', respond(502, { error: { code: 'tracking_unavailable' } }));
    expect(await fetchAzoresbusTrackingHealth()).toEqual({ status: 'unavailable', vehicles: 0 });
  });

  it('adds force=1 for a forced probe', async () => {
    const fetchMock = respond(200, { status: 'ok', vehicles: 1 });
    vi.stubGlobal('fetch', fetchMock);
    await fetchAzoresbusTrackingHealth({ force: true });
    expect(fetchMock.mock.calls[0][0]).toContain('/api/v3/azoresbus/tracking/health?force=1');
  });

  it('still rejects on transport failures so the caller can retry', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(fetchAzoresbusTrackingHealth()).rejects.toBeInstanceOf(TypeError);
  });
});
