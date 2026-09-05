import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';

import { AdSlotFrame } from '@/features/ads/components/AdSlotFrame';
import { useFrameClickHeuristic } from '@/features/ads/hooks/useFrameClickHeuristic';
import { useNearViewport } from '@/features/ads/hooks/useNearViewport';
import { isProviderBlocked, markProviderBlocked } from '@/features/ads/providers/blocked';
import { pickHorizontalSize } from '@/features/ads/providers/frame-size';
import { trackNetworkAd } from '@/features/ads/providers/network-analytics';
import type {
  ActiveConsentMode,
  AdPlacement,
  AdUnitSize,
  UnfilledReason,
  WebAdProvider,
} from '@/features/ads/providers/types';

type Props = {
  on: string;
  slot: string;
  placement: AdPlacement;
  consentMode: ActiveConsentMode;
  providers: WebAdProvider[];
  /** Called once when every eligible provider has passed. */
  onExhausted: () => void;
  /** Rendered inside the frame (same reserved height) after exhaustion, e.g. the house creative. */
  fallback?: ReactNode;
};

function RequestBeacon({
  provider,
  on,
  slot,
  placement,
}: {
  provider: WebAdProvider;
  on: string;
  slot: string;
  placement: AdPlacement;
}) {
  useEffect(() => {
    trackNetworkAd('ad_network_request', {
      provider: provider.id,
      on,
      slot,
      placement,
    });
  }, [on, placement, provider.id, slot]);
  return null;
}

/**
 * Walks the network providers for one slot: request → filled, or unfilled → next provider →
 * … → exhausted. Inline placements wait until they are near the viewport before requesting.
 */
export function NetworkAdSlot({
  on,
  slot,
  placement,
  consentMode,
  providers,
  onExhausted,
  fallback,
}: Props) {
  const { t } = useTranslation();
  const frameRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<AdUnitSize | null>(null);
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState<'requesting' | 'filled'>('requesting');

  useLayoutEffect(() => {
    setSize(pickHorizontalSize(frameRef.current?.clientWidth ?? 0));
  }, []);

  const eligible = useMemo(
    () =>
      providers.filter(
        (provider) =>
          provider.isConfigured(placement) &&
          !isProviderBlocked(provider.id) &&
          (consentMode === 'personalized' || provider.supportsNonPersonalized),
      ),
    [consentMode, placement, providers],
  );

  const near = useNearViewport(frameRef, { enabled: placement === 'inline' });
  const current = eligible[index];
  const exhausted = index >= eligible.length;

  const exhaustedReported = useRef(false);
  useEffect(() => {
    if (exhausted && !exhaustedReported.current) {
      exhaustedReported.current = true;
      onExhausted();
    }
  }, [exhausted, onExhausted]);

  const handleFilled = useCallback(() => {
    if (!current) return;
    trackNetworkAd('ad_network_filled', {
      provider: current.id,
      on,
      slot,
      placement,
    });
    setStatus('filled');
  }, [current, on, placement, slot]);

  const handleUnfilled = useCallback(
    (reason: UnfilledReason) => {
      if (!current) return;
      trackNetworkAd('ad_network_unfilled', {
        provider: current.id,
        on,
        slot,
        placement,
        reason,
      });
      if (reason === 'script-failed') {
        markProviderBlocked(current.id);
      }
      setIndex((value) => value + 1);
    },
    [current, on, placement, slot],
  );

  const handleClick = useCallback(() => {
    if (status !== 'filled' || !current) return;
    trackNetworkAd('ad_network_click', {
      provider: current.id,
      on,
      slot,
      placement,
    });
  }, [current, on, placement, slot, status]);
  useFrameClickHeuristic(frameRef, handleClick);

  const height = size
    ? Math.max(size.height, ...eligible.map((provider) => provider.frameHeight(size)))
    : undefined;

  return (
    <AdSlotFrame
      ref={frameRef}
      height={height}
      label={exhausted && fallback ? undefined : t('transitAdLabel')}
      busy={!exhausted && status !== 'filled'}
    >
      {exhausted ? (
        fallback
      ) : current && near && size ? (
        <>
          {/* Sibling rendered first so its effect (the request beacon) commits before the
                    provider's own effect can report filled/unfilled. */}
          <RequestBeacon
            key={`beacon:${current.id}:${index}`}
            provider={current}
            on={on}
            slot={slot}
            placement={placement}
          />
          <current.Slot
            key={`${current.id}:${index}`}
            on={on}
            slot={slot}
            placement={placement}
            consentMode={consentMode}
            size={size}
            onFilled={handleFilled}
            onUnfilled={handleUnfilled}
          />
        </>
      ) : null}
    </AdSlotFrame>
  );
}
