/** Stable pseudonymous session id, persisted in localStorage (web analog of expo-secure-store). */
const SESSION_KEY = 'smb_session_id';

export function getOrCreateSessionId(): string {
  try {
    const existing = localStorage.getItem(SESSION_KEY);
    if (existing) {
      return existing;
    }
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `sess_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    localStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return `sess_${Date.now().toString(36)}`;
  }
}
