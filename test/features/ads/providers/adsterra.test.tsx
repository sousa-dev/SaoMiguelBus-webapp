// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  adsterraContainerId,
  adsterraKeyFromInvoke,
  buildAdsterraSrcdoc,
  createAdsterraProvider,
  watchContainerFill,
} from '@/features/ads/providers/adsterra';
import { readWebAdConfig } from '@/features/ads/providers/config';
import { mount, type Mounted } from '../../../helpers/react';

const KEY = '0123456789abcdef0123456789abcdef';
const INVOKE = `https://pl1234567.profitablecpmrate.com/${KEY}/invoke.js`;

let mounted: Mounted | null = null;
afterEach(async () => {
  await mounted?.unmount();
  mounted = null;
});

describe('Adsterra tag helpers', () => {
  it('derives the placement key and container id from the invoke url', () => {
    expect(adsterraKeyFromInvoke(INVOKE)).toBe(KEY);
    expect(adsterraKeyFromInvoke(`//pl1.profitablecpmrate.com/${KEY}/invoke.js`)).toBe(KEY);
    expect(adsterraKeyFromInvoke('https://example.test/not-an-invoke')).toBeNull();
    expect(adsterraContainerId(INVOKE)).toBe(`container-${KEY}`);
  });

  it('builds a self-contained document with the container and the async tag', () => {
    const html = buildAdsterraSrcdoc(INVOKE);
    expect(html).toContain(`<div id="container-${KEY}"></div>`);
    expect(html).toContain(`src="${INVOKE}"`);
    expect(html).toContain('data-cfasync="false"');
    expect(html).toContain('async');
  });

  it('escapes the invoke url when embedding it', () => {
    const html = buildAdsterraSrcdoc(`${INVOKE}?a=1&b="x"`);
    expect(html).not.toContain('&b="x"');
    expect(html).toContain('&amp;b=&quot;x&quot;');
  });
});

describe('watchContainerFill', () => {
  it('resolves filled as soon as the container gets an element child', async () => {
    const doc = document.implementation.createHTMLDocument('ad');
    const container = doc.createElement('div');
    container.id = 'container-x';
    doc.body.appendChild(container);

    const pending = watchContainerFill(doc, 'container-x', 1000);
    container.appendChild(doc.createElement('iframe'));
    await expect(pending).resolves.toBe('filled');
  });

  it('resolves timeout when nothing renders in time', async () => {
    const doc = document.implementation.createHTMLDocument('ad');
    const container = doc.createElement('div');
    container.id = 'container-x';
    doc.body.appendChild(container);
    await expect(watchContainerFill(doc, 'container-x', 10)).resolves.toBe('timeout');
  });

  it('resolves timeout when the container is missing', async () => {
    const doc = document.implementation.createHTMLDocument('ad');
    await expect(watchContainerFill(doc, 'nope', 10)).resolves.toBe('timeout');
  });
});

describe('Adsterra provider', () => {
  const config = readWebAdConfig({
    VITE_WEB_AD_PROVIDERS: 'adsterra',
    VITE_ADSTERRA_NATIVE_TOP: INVOKE,
    VITE_ADSTERRA_FRAME_HEIGHT: '110',
  });

  it('is configured per placement, has no non-personalized mode and reserves the env height', () => {
    const provider = createAdsterraProvider(config);
    expect(provider.isConfigured('top')).toBe(true);
    expect(provider.isConfigured('inline')).toBe(false);
    expect(provider.supportsNonPersonalized).toBe(false);
    expect(provider.frameHeight({ width: 728, height: 90 })).toBe(110);
  });

  it('renders each unit in its own srcdoc iframe so tags never collide', async () => {
    const provider = createAdsterraProvider(config);
    mounted = await mount(
      <provider.Slot
        on="home"
        slot="top"
        placement="top"
        consentMode="personalized"
        size={{ width: 728, height: 90 }}
        onFilled={vi.fn()}
        onUnfilled={vi.fn()}
      />,
    );
    const iframe = mounted.container.querySelector('iframe')!;
    expect(iframe.getAttribute('srcdoc')).toContain(`container-${KEY}`);
    expect(iframe.getAttribute('title')).toBeTruthy();
    expect(iframe.style.height).toBe('110px');
    expect(document.querySelectorAll('script')).toHaveLength(0);
  });
});
