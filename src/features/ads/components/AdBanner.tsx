import { InternalAdBanner } from '@/features/ads/components/InternalAdBanner';
import { FirstPartyAdBanner } from '@/features/ads/components/FirstPartyAdBanner';
import { useAd } from '@/features/ads/hooks/useAd';

type Props = {
  /** Compat slot: `home` for search surfaces, `routes` for directions. */
  on: string;
  /** Distinguishes multiple banners on the same surface (separate rotation). */
  slot?: string | number;
};

/** Hybrid SMB banner: first-party image → internal fallback. Premium users see nothing. */
export function AdBanner({ on, slot }: Props) {
  const { kind, ad, internalCreative, openAd } = useAd(on, slot);

  if (kind === 'internal' && internalCreative) {
    return <InternalAdBanner creative={internalCreative} on={on} slot={slot} />;
  }

  if (kind === 'first-party' && ad) {
    return <FirstPartyAdBanner ad={ad} onOpen={openAd} />;
  }

  return null;
}
