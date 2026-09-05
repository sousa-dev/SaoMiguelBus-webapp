import { describe, expect, it } from 'vitest';

import { parseProviderList, readWebAdConfig } from '@/features/ads/providers/config';

describe('parseProviderList', () => {
  it('returns no network providers when the variable is unset or empty', () => {
    expect(parseProviderList(undefined)).toEqual([]);
    expect(parseProviderList('')).toEqual([]);
    expect(parseProviderList('  ')).toEqual([]);
  });

  it('keeps the configured order, trims whitespace and dedupes', () => {
    expect(parseProviderList(' adsense , adsterra ,adsense')).toEqual(['adsense', 'adsterra']);
  });

  it('treats house as implicit and drops unknown ids', () => {
    expect(parseProviderList('adsterra,house')).toEqual(['adsterra']);
    expect(parseProviderList('house')).toEqual([]);
    expect(parseProviderList('adsterra,propeller,mock,none')).toEqual(['adsterra', 'mock', 'none']);
  });
});

describe('readWebAdConfig', () => {
  it('reads AdSense ids and falls back to the inline slot for sidebar and footer', () => {
    const config = readWebAdConfig({
      VITE_WEB_AD_PROVIDERS: 'adsense',
      VITE_ADSENSE_CLIENT: 'ca-pub-123',
      VITE_ADSENSE_SLOT_TOP: '111',
      VITE_ADSENSE_SLOT_INLINE: '222',
    });
    expect(config.providers).toEqual(['adsense']);
    expect(config.adsense.client).toBe('ca-pub-123');
    expect(config.adsense.slots).toEqual({ top: '111', inline: '222', sidebar: '222', footer: '222' });
  });

  it('leaves missing ids null instead of empty strings', () => {
    const config = readWebAdConfig({ VITE_ADSENSE_CLIENT: '  ' });
    expect(config.adsense.client).toBeNull();
    expect(config.adsense.slots.top).toBeNull();
    expect(config.adsterra.invoke.top).toBeNull();
  });

  it('enables AdSense test mode in dev unless explicitly turned off', () => {
    expect(readWebAdConfig({ DEV: true }).adsense.test).toBe(true);
    expect(readWebAdConfig({ DEV: true, VITE_ADSENSE_TEST: 'off' }).adsense.test).toBe(false);
    expect(readWebAdConfig({ DEV: false }).adsense.test).toBe(false);
    expect(readWebAdConfig({ DEV: false, VITE_ADSENSE_TEST: 'on' }).adsense.test).toBe(true);
  });

  it('reads Adsterra invoke urls with inline fallback and a default frame height', () => {
    const config = readWebAdConfig({
      VITE_ADSTERRA_NATIVE_TOP: 'https://pl1.profitablecpmrate.com/aaaa/invoke.js',
      VITE_ADSTERRA_NATIVE_INLINE: 'https://pl1.profitablecpmrate.com/bbbb/invoke.js',
    });
    expect(config.adsterra.invoke.top).toContain('aaaa');
    expect(config.adsterra.invoke.sidebar).toContain('bbbb');
    expect(config.adsterra.frameHeight).toBe(120);
    expect(readWebAdConfig({ VITE_ADSTERRA_FRAME_HEIGHT: '90' }).adsterra.frameHeight).toBe(90);
    expect(readWebAdConfig({ VITE_ADSTERRA_FRAME_HEIGHT: 'abc' }).adsterra.frameHeight).toBe(120);
  });

  it('defaults the mock provider to filled', () => {
    expect(readWebAdConfig({}).mock.result).toBe('filled');
    expect(readWebAdConfig({ VITE_WEB_AD_MOCK_RESULT: 'unfilled' }).mock.result).toBe('unfilled');
  });
});
