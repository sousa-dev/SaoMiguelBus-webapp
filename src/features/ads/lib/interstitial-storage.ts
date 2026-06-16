import type { InterstitialSessionState } from '@/features/ads/lib/interstitial-policy';

const DISMISSED_AT_KEY = 'smb_interstitial_dismissed_at';
const SESSION_HAS_SEARCHED_KEY = 'smb_interstitial_has_searched';
const SESSION_DISMISSED_KEY = 'smb_interstitial_session_dismissed';

function readSessionFlag(key: string): boolean {
  try {
    return sessionStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function writeSessionFlag(key: string, value: boolean): void {
  try {
    if (value) {
      sessionStorage.setItem(key, '1');
    } else {
      sessionStorage.removeItem(key);
    }
  } catch {
    /* ignore */
  }
}

export function loadInterstitialSessionState(): InterstitialSessionState {
  let dismissedAt: number | null = null;
  try {
    const raw = localStorage.getItem(DISMISSED_AT_KEY);
    const parsed = raw ? Number(raw) : null;
    if (Number.isFinite(parsed)) {
      dismissedAt = parsed;
    }
  } catch {
    /* ignore */
  }

  return {
    hasSearchedThisSession: readSessionFlag(SESSION_HAS_SEARCHED_KEY),
    sessionDismissed: readSessionFlag(SESSION_DISMISSED_KEY),
    dismissedAt,
  };
}

export function persistInterstitialSessionState(patch: Partial<InterstitialSessionState>): void {
  if (patch.hasSearchedThisSession != null) {
    writeSessionFlag(SESSION_HAS_SEARCHED_KEY, patch.hasSearchedThisSession);
  }
  if (patch.sessionDismissed != null) {
    writeSessionFlag(SESSION_DISMISSED_KEY, patch.sessionDismissed);
  }
  if (patch.dismissedAt !== undefined) {
    try {
      if (patch.dismissedAt == null) {
        localStorage.removeItem(DISMISSED_AT_KEY);
      } else {
        localStorage.setItem(DISMISSED_AT_KEY, String(patch.dismissedAt));
      }
    } catch {
      /* ignore */
    }
  }
}

export function markInterstitialDismissed(nowMs: number): void {
  persistInterstitialSessionState({
    sessionDismissed: true,
    dismissedAt: nowMs,
  });
}

/** Test helper — reset session + persisted cooldown. */
export function resetInterstitialStorageForTests(): void {
  writeSessionFlag(SESSION_HAS_SEARCHED_KEY, false);
  writeSessionFlag(SESSION_DISMISSED_KEY, false);
  try {
    localStorage.removeItem(DISMISSED_AT_KEY);
  } catch {
    /* ignore */
  }
}
