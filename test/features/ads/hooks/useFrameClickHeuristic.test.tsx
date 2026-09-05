// @vitest-environment jsdom
import { useRef } from 'react';
import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useFrameClickHeuristic } from '@/features/ads/hooks/useFrameClickHeuristic';
import { mount, type Mounted } from '../../../helpers/react';

function Probe({ onClick }: { onClick: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useFrameClickHeuristic(ref, onClick);
  return <div ref={ref} data-testid="frame" />;
}

let mounted: Mounted | null = null;
afterEach(async () => {
  await mounted?.unmount();
  mounted = null;
});

async function fire(target: EventTarget, type: string) {
  await act(async () => {
    target.dispatchEvent(new Event(type, { bubbles: true }));
  });
}

describe('useFrameClickHeuristic', () => {
  it('reports a click when the window loses focus while the pointer is over the frame', async () => {
    const onClick = vi.fn();
    mounted = await mount(<Probe onClick={onClick} />);
    const frame = mounted.container.firstElementChild!;

    await fire(window, 'blur');
    expect(onClick).not.toHaveBeenCalled();

    await fire(frame, 'pointerenter');
    await fire(window, 'blur');
    expect(onClick).toHaveBeenCalledTimes(1);

    // A second blur without leaving and re-entering is the same interaction.
    await fire(window, 'blur');
    expect(onClick).toHaveBeenCalledTimes(1);

    await fire(frame, 'pointerleave');
    await fire(frame, 'pointerenter');
    await fire(window, 'blur');
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('treats a touch inside the frame as hovering', async () => {
    const onClick = vi.fn();
    mounted = await mount(<Probe onClick={onClick} />);
    await fire(mounted.container.firstElementChild!, 'touchstart');
    await fire(window, 'blur');
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
