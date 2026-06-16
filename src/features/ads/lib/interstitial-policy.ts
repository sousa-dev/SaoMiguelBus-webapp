/** Cross-session cooldown after the user dismisses the upsell modal (~30 min). */
export const INTERSTITIAL_COOLDOWN_MS = 30 * 60 * 1000;

/** Subsequent searches in the same session. */
export const INTERSTITIAL_SUBSEQUENT_PROBABILITY = 0.15;

export type InterstitialSessionState = {
  hasSearchedThisSession: boolean;
  sessionDismissed: boolean;
  dismissedAt: number | null;
};

export type InterstitialPolicyDecision = {
  show: boolean;
  nextState: Partial<InterstitialSessionState>;
};

export function evaluateInterstitialPolicy(
  state: InterstitialSessionState,
  nowMs: number,
  randomValue: number,
): InterstitialPolicyDecision {
  if (!state.hasSearchedThisSession && !state.sessionDismissed) {
    return {
      show: true,
      nextState: { hasSearchedThisSession: true },
    };
  }

  if (state.sessionDismissed) {
    return { show: false, nextState: {} };
  }

  if (state.dismissedAt != null && nowMs - state.dismissedAt < INTERSTITIAL_COOLDOWN_MS) {
    return { show: false, nextState: {} };
  }

  if (randomValue < INTERSTITIAL_SUBSEQUENT_PROBABILITY) {
    return { show: true, nextState: {} };
  }

  return { show: false, nextState: {} };
}
