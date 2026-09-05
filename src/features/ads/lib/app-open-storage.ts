const LAST_FULL_SCREEN_AD_AT_KEY = 'smb_last_full_screen_ad_at';
const SESSION_APP_OPEN_SHOWN_KEY = 'smb_session_app_open_shown';

export function loadLastFullScreenAdAt(): number | null {
  try {
    const raw = localStorage.getItem(LAST_FULL_SCREEN_AD_AT_KEY);
    const value = raw ? Number(raw) : null;
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

export function markFullScreenAdShown(nowMs: number): void {
  try {
    localStorage.setItem(LAST_FULL_SCREEN_AD_AT_KEY, String(nowMs));
  } catch {
    /* ignore */
  }
}

export function hasSessionAppOpenShown(): boolean {
  try {
    return sessionStorage.getItem(SESSION_APP_OPEN_SHOWN_KEY) === '1';
  } catch {
    return false;
  }
}

export function markSessionAppOpenShown(): void {
  try {
    sessionStorage.setItem(SESSION_APP_OPEN_SHOWN_KEY, '1');
  } catch {
    /* ignore */
  }
}

/** Test helper. */
export function resetFullScreenAdStorageForTests(): void {
  try {
    localStorage.removeItem(LAST_FULL_SCREEN_AD_AT_KEY);
    sessionStorage.removeItem(SESSION_APP_OPEN_SHOWN_KEY);
  } catch {
    /* ignore */
  }
}
