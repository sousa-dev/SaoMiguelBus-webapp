import { afterEach, describe, expect, it, vi } from 'vitest';

import { HOP_ON_OFF_DEFAULT_URL, resolveHopOnOffUrl } from '@/config/hop-on-hop-off';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('resolveHopOnOffUrl', () => {
  it('falls back to the default affiliate URL', () => {
    expect(resolveHopOnOffUrl()).toBe(HOP_ON_OFF_DEFAULT_URL);
  });

  it('prefers an env override when set', () => {
    vi.stubEnv('VITE_HOP_ON_OFF_URL', 'https://example.test/override');
    expect(resolveHopOnOffUrl()).toBe('https://example.test/override');
  });
});
