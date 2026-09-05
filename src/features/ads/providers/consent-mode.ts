import type { NetworkConsentMode } from '@/features/ads/providers/types';
import { useConsentStore } from '@/lib/consent-store';
import type { ConsentPurposes } from '@/lib/types';

/**
 * Maps the consent banner's purposes onto what the network tier may do.
 * `ads` is the gate for loading any third-party script; `personalization` decides profiling.
 */
export function resolveNetworkConsentMode(input: {
  decided: boolean;
  purposes: ConsentPurposes;
}): NetworkConsentMode {
  if (!input.decided || !input.purposes.ads) {
    return 'blocked';
  }
  return input.purposes.personalization ? 'personalized' : 'non-personalized';
}

export function useNetworkConsentMode(): NetworkConsentMode {
  const decided = useConsentStore((s) => s.decided);
  const purposes = useConsentStore((s) => s.purposes);
  return resolveNetworkConsentMode({ decided, purposes });
}
