import { useLocation } from 'react-router-dom';

import { FirstPartyAdBanner } from '@/features/ads/components/FirstPartyAdBanner';
import { InternalAdBanner } from '@/features/ads/components/InternalAdBanner';
import { NetworkAdSlot } from '@/features/ads/components/NetworkAdSlot';
import { useAd } from '@/features/ads/hooks/useAd';
import { isNetworkAdAllowedOnPath, resolvePlacement } from '@/features/ads/lib/placement-policy';
import { useNetworkConsentMode } from '@/features/ads/providers/consent-mode';
import { getNetworkProviders } from '@/features/ads/providers/registry';
import type { AdPlacement } from '@/features/ads/providers/types';

type Props = {
  /** Compat slot: `home` for search surfaces, `routes` for directions, module key elsewhere. */
  on: string;
  /** Distinguishes multiple banners on the same surface (separate rotation). */
  slot?: string | number;
  /** Layout bucket; derived from the slot name when omitted (`top` → top, `inline-*` → inline). */
  placement?: AdPlacement;
  /**
   * Whether the page currently shows publisher content. Network ads never render on loading or
   * empty states; the house creative still may.
   */
  content?: boolean;
};

const noop = () => {};

/**
 * Waterfall: first-party campaign → network providers (env order, consent permitting) → house
 * creative. Premium users see nothing.
 */
export function AdBanner({ on, slot = 'top', placement, content = true }: Props) {
  const { kind, ad, internalCreative, openAd } = useAd(on, slot);
  const { pathname } = useLocation();
  const consentMode = useNetworkConsentMode();
  const providers = getNetworkProviders();

  if (kind === 'first-party' && ad) {
    return <FirstPartyAdBanner ad={ad} onOpen={openAd} on={on} />;
  }

  if (kind !== 'internal' || !internalCreative) {
    return null;
  }

  const house = <InternalAdBanner creative={internalCreative} on={on} slot={slot} />;
  const networkEligible =
    providers.length > 0 &&
    consentMode !== 'blocked' &&
    content &&
    isNetworkAdAllowedOnPath(pathname);

  if (!networkEligible) {
    return house;
  }

  return (
    <NetworkAdSlot
      on={on}
      slot={String(slot)}
      placement={placement ?? resolvePlacement(slot)}
      consentMode={consentMode}
      providers={providers}
      onExhausted={noop}
      fallback={<div className="h-full w-full [&>button]:h-full">{house}</div>}
    />
  );
}
