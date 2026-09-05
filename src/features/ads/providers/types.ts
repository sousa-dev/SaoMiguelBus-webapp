import type { ComponentType } from 'react';

/** Where a slot sits on the page. Drives the reserved size and the per-placement network ids. */
export type AdPlacement = 'top' | 'inline' | 'sidebar' | 'footer';

export const AD_PLACEMENTS: readonly AdPlacement[] = ['top', 'inline', 'sidebar', 'footer'];

/** Third-party tiers. `house` is implicit and always terminal, so it is not a provider id. */
export type NetworkProviderId = 'adsense' | 'adsterra' | 'mock' | 'none';

export const NETWORK_PROVIDER_IDS: readonly NetworkProviderId[] = [
  'adsense',
  'adsterra',
  'mock',
  'none',
];

export type UnfilledReason = 'unfilled' | 'script-failed' | 'timeout' | 'not-configured';

/**
 * `blocked`: no decision yet or the `ads` purpose is off → skip every network.
 * `non-personalized`: `ads` on, `personalization` off → providers with an NPA mode only.
 * `personalized`: both purposes on.
 */
export type NetworkConsentMode = 'blocked' | 'non-personalized' | 'personalized';
export type ActiveConsentMode = Exclude<NetworkConsentMode, 'blocked'>;

export interface AdUnitSize {
  width: number;
  height: number;
}

export interface NetworkSlotProps {
  on: string;
  slot: string;
  placement: AdPlacement;
  consentMode: ActiveConsentMode;
  /** Standard unit that fits the measured container width. */
  size: AdUnitSize;
  onFilled: () => void;
  onUnfilled: (reason: UnfilledReason) => void;
}

export interface WebAdProvider {
  id: NetworkProviderId;
  /** Whether the network can serve without profiling; `false` skips it in non-personalized mode. */
  supportsNonPersonalized: boolean;
  isConfigured(placement: AdPlacement): boolean;
  /** Height the frame must reserve for this provider's unit at the given size. */
  frameHeight(size: AdUnitSize): number;
  /** Injects the network script at most once. Must only be called after consent. */
  load(mode: ActiveConsentMode): Promise<'ready' | 'blocked'>;
  Slot: ComponentType<NetworkSlotProps>;
  teardown(): void;
}

/** Static shape of the `VITE_*` variables the ads feature reads. */
export interface WebAdEnv {
  VITE_WEB_AD_PROVIDERS?: string;
  VITE_ADSENSE_CLIENT?: string;
  VITE_ADSENSE_SLOT_TOP?: string;
  VITE_ADSENSE_SLOT_INLINE?: string;
  VITE_ADSENSE_SLOT_SIDEBAR?: string;
  VITE_ADSENSE_SLOT_FOOTER?: string;
  VITE_ADSENSE_TEST?: string;
  VITE_ADSTERRA_NATIVE_TOP?: string;
  VITE_ADSTERRA_NATIVE_INLINE?: string;
  VITE_ADSTERRA_NATIVE_SIDEBAR?: string;
  VITE_ADSTERRA_NATIVE_FOOTER?: string;
  VITE_ADSTERRA_FRAME_HEIGHT?: string;
  VITE_WEB_AD_MOCK_RESULT?: string;
  DEV?: boolean;
}

export interface WebAdConfig {
  providers: NetworkProviderId[];
  adsense: {
    client: string | null;
    slots: Record<AdPlacement, string | null>;
    test: boolean;
  };
  adsterra: {
    invoke: Record<AdPlacement, string | null>;
    frameHeight: number;
  };
  mock: {
    result: 'filled' | 'unfilled';
  };
}
