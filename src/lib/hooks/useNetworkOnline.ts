import { useEffect, useState } from 'react';

import { getNetworkOnline } from '@/lib/network-online';

/** `navigator.onLine` as reactive state. */
export function useNetworkOnline(): boolean {
  const [online, setOnline] = useState(() => getNetworkOnline());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const update = () => setOnline(getNetworkOnline());
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  return online;
}
