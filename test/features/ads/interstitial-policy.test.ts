import { describe, expect, it } from 'vitest';

import {
  evaluateInterstitialPolicy,
  INTERSTITIAL_COOLDOWN_MS,
  INTERSTITIAL_SUBSEQUENT_PROBABILITY,
} from '@/features/ads/lib/interstitial-policy';

describe('evaluateInterstitialPolicy', () => {
  const now = Date.now();

  it('shows on first search in session', () => {
    const decision = evaluateInterstitialPolicy(
      { hasSearchedThisSession: false, sessionDismissed: false, dismissedAt: null },
      now,
      0.99,
    );
    expect(decision.show).toBe(true);
    expect(decision.nextState.hasSearchedThisSession).toBe(true);
  });

  it('blocks after session dismiss', () => {
    const decision = evaluateInterstitialPolicy(
      { hasSearchedThisSession: true, sessionDismissed: true, dismissedAt: now },
      now,
      0,
    );
    expect(decision.show).toBe(false);
  });

  it('respects cross-session cooldown', () => {
    const decision = evaluateInterstitialPolicy(
      {
        hasSearchedThisSession: true,
        sessionDismissed: false,
        dismissedAt: now - INTERSTITIAL_COOLDOWN_MS + 1,
      },
      now,
      0,
    );
    expect(decision.show).toBe(false);
  });

  it('allows subsequent search with probability', () => {
    const decision = evaluateInterstitialPolicy(
      {
        hasSearchedThisSession: true,
        sessionDismissed: false,
        dismissedAt: now - INTERSTITIAL_COOLDOWN_MS - 1,
      },
      now,
      INTERSTITIAL_SUBSEQUENT_PROBABILITY - 0.01,
    );
    expect(decision.show).toBe(true);
  });
});
