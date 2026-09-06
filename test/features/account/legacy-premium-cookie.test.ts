// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';

import {
  clearPendingLegacyPremiumEmail,
  getPendingLegacyPremiumEmail,
  migrateLegacyPremiumCookie,
} from '@/features/account/lib/legacy-premium-cookie';

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)};path=/`;
}

beforeEach(() => {
  for (const name of ['premiumEmail', 'premiumExpiresAt', 'premiumLastVerified']) {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
  }
  sessionStorage.clear();
});

describe('legacy premium cookie migration', () => {
  it('does nothing when there is no legacy cookie', () => {
    expect(migrateLegacyPremiumCookie()).toBeNull();
    expect(getPendingLegacyPremiumEmail()).toBeNull();
  });

  it('moves the email out of the cookies into a pending session notice', () => {
    setCookie('premiumEmail', 'Old@Example.com');
    setCookie('premiumExpiresAt', '2027-01-01');
    setCookie('premiumLastVerified', '2026-01-01');

    expect(migrateLegacyPremiumCookie()).toBe('old@example.com');
    expect(document.cookie).not.toContain('premiumEmail');
    expect(document.cookie).not.toContain('premiumExpiresAt');
    expect(getPendingLegacyPremiumEmail()).toBe('old@example.com');

    clearPendingLegacyPremiumEmail();
    expect(getPendingLegacyPremiumEmail()).toBeNull();
  });

  it('keeps an already pending email when called again', () => {
    setCookie('premiumEmail', 'a@b.c');
    migrateLegacyPremiumCookie();
    expect(migrateLegacyPremiumCookie()).toBeNull();
    expect(getPendingLegacyPremiumEmail()).toBe('a@b.c');
  });
});
