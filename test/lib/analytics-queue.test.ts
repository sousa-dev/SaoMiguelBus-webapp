import { describe, expect, it } from 'vitest';

import { parseAnalyticsQueue, trimAnalyticsQueue } from '@/lib/analytics-queue-logic';
import { MAX_QUEUE_SIZE, type QueuedAnalyticsEvent } from '@/lib/analytics-queue-types';

describe('analytics queue logic', () => {
  it('parseAnalyticsQueue returns empty for invalid input', () => {
    expect(parseAnalyticsQueue(null)).toEqual([]);
    expect(parseAnalyticsQueue('not-json')).toEqual([]);
    expect(parseAnalyticsQueue('{}')).toEqual([]);
  });

  it('trimAnalyticsQueue drops oldest events', () => {
    const events: QueuedAnalyticsEvent[] = Array.from({ length: MAX_QUEUE_SIZE + 3 }, (_, index) => ({
      module: 'transit',
      event_type: 'load',
      properties: { index },
      occurred_at: new Date(Date.UTC(2026, 0, 1, 0, 0, index)).toISOString(),
    }));
    const trimmed = trimAnalyticsQueue(events, MAX_QUEUE_SIZE);
    expect(trimmed).toHaveLength(MAX_QUEUE_SIZE);
    expect(trimmed[0]?.properties?.index).toBe(3);
    expect(trimmed.at(-1)?.properties?.index).toBe(MAX_QUEUE_SIZE + 2);
  });
});
