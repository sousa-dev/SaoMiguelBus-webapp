// @vitest-environment jsdom

import { afterEach, describe, expect, it } from 'vitest';

import { IOS_APP_ID } from '@/lib/app-links';
import { setHead } from '@/lib/head';

describe('setHead', () => {
  afterEach(() => {
    document.head.innerHTML = '';
    document.title = '';
  });

  it('publishes the iOS app id for Safari install prompts', () => {
    setHead({
      title: 'São Miguel Bus',
      description: 'Horários e rotas de autocarros em São Miguel.',
    });

    const meta = document.head.querySelector<HTMLMetaElement>('meta[name="apple-itunes-app"]');

    expect(meta?.content).toBe(`app-id=${IOS_APP_ID}`);
  });
});
