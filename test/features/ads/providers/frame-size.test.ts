import { describe, expect, it } from 'vitest';

import { pickHorizontalSize } from '@/features/ads/providers/frame-size';

describe('pickHorizontalSize', () => {
  it('picks the largest standard horizontal unit that fits the container', () => {
    expect(pickHorizontalSize(1100)).toEqual({ width: 728, height: 90 });
    expect(pickHorizontalSize(728)).toEqual({ width: 728, height: 90 });
    expect(pickHorizontalSize(684)).toEqual({ width: 468, height: 60 });
    expect(pickHorizontalSize(468)).toEqual({ width: 468, height: 60 });
    expect(pickHorizontalSize(360)).toEqual({ width: 320, height: 100 });
  });

  it('falls back to the smallest mobile banner below 320px', () => {
    expect(pickHorizontalSize(300)).toEqual({ width: 320, height: 50 });
    expect(pickHorizontalSize(0)).toEqual({ width: 320, height: 50 });
  });
});
