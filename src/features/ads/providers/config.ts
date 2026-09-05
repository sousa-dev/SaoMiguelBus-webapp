import {
  NETWORK_PROVIDER_IDS,
  type AdPlacement,
  type NetworkProviderId,
  type WebAdConfig,
  type WebAdEnv,
} from '@/features/ads/providers/types';

const DEFAULT_ADSTERRA_FRAME_HEIGHT = 120;

function isNetworkProviderId(value: string): value is NetworkProviderId {
  return (NETWORK_PROVIDER_IDS as readonly string[]).includes(value);
}

/** `"adsense, adsterra, house"` → `['adsense', 'adsterra']`. House is implicit; unknown ids are dropped. */
export function parseProviderList(raw: string | undefined): NetworkProviderId[] {
  if (!raw) return [];
  const seen = new Set<NetworkProviderId>();
  for (const part of raw.split(',')) {
    const id = part.trim().toLowerCase();
    if (isNetworkProviderId(id)) {
      seen.add(id);
    }
  }
  return [...seen];
}

function clean(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function perPlacement(input: {
  top?: string;
  inline?: string;
  sidebar?: string;
  footer?: string;
}): Record<AdPlacement, string | null> {
  const inline = clean(input.inline);
  return {
    top: clean(input.top),
    inline,
    sidebar: clean(input.sidebar) ?? inline,
    footer: clean(input.footer) ?? inline,
  };
}

function resolveAdsenseTest(env: WebAdEnv): boolean {
  const flag = env.VITE_ADSENSE_TEST?.trim().toLowerCase();
  if (flag === 'on') return true;
  if (flag === 'off') return false;
  return env.DEV === true;
}

function resolveFrameHeight(raw: string | undefined): number {
  const parsed = Number.parseInt(raw ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_ADSTERRA_FRAME_HEIGHT;
}

export function readWebAdConfig(env: WebAdEnv): WebAdConfig {
  return {
    providers: parseProviderList(env.VITE_WEB_AD_PROVIDERS),
    adsense: {
      client: clean(env.VITE_ADSENSE_CLIENT),
      slots: perPlacement({
        top: env.VITE_ADSENSE_SLOT_TOP,
        inline: env.VITE_ADSENSE_SLOT_INLINE,
        sidebar: env.VITE_ADSENSE_SLOT_SIDEBAR,
        footer: env.VITE_ADSENSE_SLOT_FOOTER,
      }),
      test: resolveAdsenseTest(env),
    },
    adsterra: {
      invoke: perPlacement({
        top: env.VITE_ADSTERRA_NATIVE_TOP,
        inline: env.VITE_ADSTERRA_NATIVE_INLINE,
        sidebar: env.VITE_ADSTERRA_NATIVE_SIDEBAR,
        footer: env.VITE_ADSTERRA_NATIVE_FOOTER,
      }),
      frameHeight: resolveFrameHeight(env.VITE_ADSTERRA_FRAME_HEIGHT),
    },
    mock: {
      result: env.VITE_WEB_AD_MOCK_RESULT?.trim().toLowerCase() === 'unfilled' ? 'unfilled' : 'filled',
    },
  };
}

/**
 * Vite only replaces static `import.meta.env.VITE_X` reads at build time, so every variable is
 * named explicitly here (a dynamic `import.meta.env[key]` is `undefined` in release builds).
 */
function readStaticEnv(): WebAdEnv {
  return {
    VITE_WEB_AD_PROVIDERS: import.meta.env.VITE_WEB_AD_PROVIDERS as string | undefined,
    VITE_ADSENSE_CLIENT: import.meta.env.VITE_ADSENSE_CLIENT as string | undefined,
    VITE_ADSENSE_SLOT_TOP: import.meta.env.VITE_ADSENSE_SLOT_TOP as string | undefined,
    VITE_ADSENSE_SLOT_INLINE: import.meta.env.VITE_ADSENSE_SLOT_INLINE as string | undefined,
    VITE_ADSENSE_SLOT_SIDEBAR: import.meta.env.VITE_ADSENSE_SLOT_SIDEBAR as string | undefined,
    VITE_ADSENSE_SLOT_FOOTER: import.meta.env.VITE_ADSENSE_SLOT_FOOTER as string | undefined,
    VITE_ADSENSE_TEST: import.meta.env.VITE_ADSENSE_TEST as string | undefined,
    VITE_ADSTERRA_NATIVE_TOP: import.meta.env.VITE_ADSTERRA_NATIVE_TOP as string | undefined,
    VITE_ADSTERRA_NATIVE_INLINE: import.meta.env.VITE_ADSTERRA_NATIVE_INLINE as string | undefined,
    VITE_ADSTERRA_NATIVE_SIDEBAR: import.meta.env.VITE_ADSTERRA_NATIVE_SIDEBAR as string | undefined,
    VITE_ADSTERRA_NATIVE_FOOTER: import.meta.env.VITE_ADSTERRA_NATIVE_FOOTER as string | undefined,
    VITE_ADSTERRA_FRAME_HEIGHT: import.meta.env.VITE_ADSTERRA_FRAME_HEIGHT as string | undefined,
    VITE_WEB_AD_MOCK_RESULT: import.meta.env.VITE_WEB_AD_MOCK_RESULT as string | undefined,
    DEV: import.meta.env.DEV,
  };
}

let cached: WebAdConfig | null = null;

/** Read once at startup; tests inject their own env via `readWebAdConfig` or `setWebAdConfigForTests`. */
export function getWebAdConfig(): WebAdConfig {
  if (!cached) {
    cached = readWebAdConfig(readStaticEnv());
  }
  return cached;
}

export function setWebAdConfigForTests(config: WebAdConfig | null): void {
  cached = config;
}
