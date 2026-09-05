/** Minimum gap between session app-open and interstitial full-screen ads. */
export const APP_OPEN_INTERSTITIAL_COOLDOWN_MS = 2 * 60 * 1000;

export type InternalAppOpenPolicyContext = {
  isPremium: boolean;
  isInternalFullscreenVisible: boolean;
  isInterstitialShowing: boolean;
  isFirstPartyInterstitialVisible: boolean;
  lastFullScreenAdAt: number | null;
  sessionAppOpenAlreadyShown: boolean;
};

export type AppOpenPolicyDecision = {
  show: boolean;
  reason?: string;
};

/** Web session-start app-open (no AdMob / consent gates). */
export function evaluateInternalAppOpenPolicy(
  context: InternalAppOpenPolicyContext,
  nowMs: number,
): AppOpenPolicyDecision {
  if (context.isPremium) {
    return { show: false, reason: 'premium' };
  }
  if (context.sessionAppOpenAlreadyShown) {
    return { show: false, reason: 'session_already_shown' };
  }
  if (context.isInternalFullscreenVisible) {
    return { show: false, reason: 'already_showing' };
  }
  if (context.isInterstitialShowing || context.isFirstPartyInterstitialVisible) {
    return { show: false, reason: 'other_fullscreen_active' };
  }

  if (context.lastFullScreenAdAt != null) {
    const elapsed = nowMs - context.lastFullScreenAdAt;
    if (elapsed < APP_OPEN_INTERSTITIAL_COOLDOWN_MS) {
      return { show: false, reason: 'cooldown' };
    }
  }

  return { show: true };
}
