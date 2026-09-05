// @vitest-environment jsdom
import { useRef } from 'react';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { useNearViewport } from '@/features/ads/hooks/useNearViewport';
import { mount, type Mounted } from '../../../helpers/react';

type Callback = (entries: Array<{ isIntersecting: boolean }>) => void;

const observers: Array<{ callback: Callback; options?: IntersectionObserverInit; observed: Element[] }> = [];

class FakeIntersectionObserver {
  observed: Element[] = [];
  constructor(
    public callback: Callback,
    public options?: IntersectionObserverInit,
  ) {
    observers.push({ callback, options, observed: this.observed });
  }
  observe(el: Element) {
    this.observed.push(el);
  }
  unobserve() {}
  disconnect() {}
}

function Probe({ enabled }: { enabled: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const near = useNearViewport(ref, { enabled });
  return <div ref={ref}>{near ? 'near' : 'far'}</div>;
}

let mounted: Mounted | null = null;
const original = globalThis.IntersectionObserver;

beforeEach(() => {
  observers.length = 0;
  globalThis.IntersectionObserver = FakeIntersectionObserver as unknown as typeof IntersectionObserver;
});

afterEach(async () => {
  await mounted?.unmount();
  mounted = null;
  globalThis.IntersectionObserver = original;
});

describe('useNearViewport', () => {
  it('is far until the observer reports an intersection, then stays near', async () => {
    mounted = await mount(<Probe enabled />);
    expect(mounted.container.textContent).toBe('far');
    expect(observers).toHaveLength(1);
    expect(observers[0].options?.rootMargin).toBe('600px');

    await act(async () => {
      observers[0].callback([{ isIntersecting: true }]);
    });
    expect(mounted.container.textContent).toBe('near');

    await act(async () => {
      observers[0].callback([{ isIntersecting: false }]);
    });
    expect(mounted.container.textContent).toBe('near');
  });

  it('is near immediately when lazy loading is disabled', async () => {
    mounted = await mount(<Probe enabled={false} />);
    expect(mounted.container.textContent).toBe('near');
    expect(observers).toHaveLength(0);
  });

  it('is near immediately when the browser has no IntersectionObserver', async () => {
    globalThis.IntersectionObserver = undefined as unknown as typeof IntersectionObserver;
    mounted = await mount(<Probe enabled />);
    expect(mounted.container.textContent).toBe('near');
  });
});
