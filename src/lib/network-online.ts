let latestOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

export function getNetworkOnline(): boolean {
  return latestOnline;
}

export function setNetworkOnline(next: boolean): void {
  latestOnline = next;
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => setNetworkOnline(true));
  window.addEventListener('offline', () => setNetworkOnline(false));
}
