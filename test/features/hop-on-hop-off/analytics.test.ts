import { describe, expect, it, vi } from 'vitest';

const { track } = vi.hoisted(() => ({ track: vi.fn() }));
vi.mock('@/lib/analytics', () => ({ track }));

import { trackHopOnOffBookClick, trackHopOnOffSheetOpen } from '@/features/hop-on-hop-off/lib/analytics';

describe('trackHopOnOffSheetOpen', () => {
  it('tracks the source', () => {
    trackHopOnOffSheetOpen('hub');
    expect(track).toHaveBeenCalledWith('hop_on_off', 'sheet_open', { source: 'hub' });
  });
});

describe('trackHopOnOffBookClick', () => {
  it('tracks the source and the URL host, without the full query string', () => {
    trackHopOnOffBookClick('minibus', 'https://www.getyourguide.com/some-tour?partner_id=SECRET');
    expect(track).toHaveBeenCalledWith('hop_on_off', 'book_click', { source: 'minibus', url_host: 'getyourguide.com' });
  });

  it('tolerates an unparsable URL', () => {
    trackHopOnOffBookClick('transit', 'not-a-url');
    expect(track).toHaveBeenCalledWith('hop_on_off', 'book_click', { source: 'transit', url_host: undefined });
  });
});
