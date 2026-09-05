import type { AdPlacement, NetworkProviderId, UnfilledReason } from '@/features/ads/providers/types';
import { track } from '@/lib/analytics';

export type NetworkAdEvent =
  | 'ad_network_request'
  | 'ad_network_filled'
  | 'ad_network_unfilled'
  | 'ad_network_click';

export type NetworkAdEventProps = {
  provider: NetworkProviderId;
  on: string;
  slot: string;
  placement: AdPlacement;
  reason?: UnfilledReason;
};

/**
 * Fill-rate telemetry for the network tier. One literal `track()` per event so the analytics
 * parity test (which greps for literal module/event pairs) can see them.
 */
export function trackNetworkAd(event: NetworkAdEvent, props: NetworkAdEventProps): void {
  switch (event) {
    case 'ad_network_request':
      track('transit', 'ad_network_request', props);
      return;
    case 'ad_network_filled':
      track('transit', 'ad_network_filled', props);
      return;
    case 'ad_network_unfilled':
      track('transit', 'ad_network_unfilled', props);
      return;
    case 'ad_network_click':
      track('transit', 'ad_network_click', props);
      return;
  }
}
