import { parseAnalyticsQueue, trimAnalyticsQueue } from '@/lib/analytics-queue-logic';
import {
  ANALYTICS_QUEUE_KEY,
  BATCH_SIZE,
  FLUSH_CAP_PER_CYCLE,
  MAX_QUEUE_SIZE,
  type QueuedAnalyticsEvent,
} from '@/lib/analytics-queue-types';
import { getNetworkOnline } from '@/lib/network-online';
import { getOrCreateSessionId } from '@/lib/session';

export {
  ANALYTICS_QUEUE_KEY,
  BATCH_SIZE,
  FLUSH_CAP_PER_CYCLE,
  MAX_QUEUE_SIZE,
  type QueuedAnalyticsEvent,
} from '@/lib/analytics-queue-types';

type QueueStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

const defaultStorage: QueueStorage = {
  getItem: (key) => {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    return localStorage.getItem(key);
  },
  setItem: (key, value) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
  },
  removeItem: (key) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
  },
};

let queueStorage: QueueStorage = defaultStorage;

/** Test hook — reset to default localStorage when passed null. */
export function setAnalyticsQueueStorageForTests(storage: QueueStorage | null): void {
  queueStorage = storage ?? defaultStorage;
}

let flushInProgress = false;

export async function loadAnalyticsQueue(): Promise<QueuedAnalyticsEvent[]> {
  return parseAnalyticsQueue(queueStorage.getItem(ANALYTICS_QUEUE_KEY));
}

function saveAnalyticsQueue(events: QueuedAnalyticsEvent[]): void {
  queueStorage.setItem(ANALYTICS_QUEUE_KEY, JSON.stringify(events));
}

function trimQueue(events: QueuedAnalyticsEvent[]): QueuedAnalyticsEvent[] {
  if (events.length <= MAX_QUEUE_SIZE) {
    return events;
  }
  console.warn(`analytics queue overflow — dropping ${events.length - MAX_QUEUE_SIZE} oldest events`);
  return trimAnalyticsQueue(events, MAX_QUEUE_SIZE);
}

export async function purgeAnalyticsQueue(): Promise<void> {
  queueStorage.removeItem(ANALYTICS_QUEUE_KEY);
}

export async function enqueueAnalyticsEvent(
  module: string,
  eventType: string,
  properties: Record<string, unknown> = {},
): Promise<void> {
  const queue = await loadAnalyticsQueue();
  queue.push({
    module,
    event_type: eventType,
    properties,
    occurred_at: new Date().toISOString(),
  });
  saveAnalyticsQueue(trimQueue(queue));
}

export async function flushAnalyticsQueue(): Promise<number> {
  if (flushInProgress) {
    return 0;
  }
  const { useConsentStore } = await import('@/lib/consent-store');
  if (!useConsentStore.getState().hasAnalyticsConsent()) {
    await purgeAnalyticsQueue();
    return 0;
  }
  if (!getNetworkOnline()) {
    return 0;
  }

  flushInProgress = true;
  let totalSent = 0;
  try {
    const { postAnalyticsEvents } = await import('@/lib/api');
    const sessionId = getOrCreateSessionId();
    while (totalSent < FLUSH_CAP_PER_CYCLE) {
      const queue = await loadAnalyticsQueue();
      if (queue.length === 0) {
        break;
      }
      const batch = queue.slice(0, BATCH_SIZE);
      try {
        await postAnalyticsEvents(sessionId, batch);
        saveAnalyticsQueue(queue.slice(batch.length));
        totalSent += batch.length;
      } catch (error) {
        console.warn('analytics flush failed — keeping queued events', error);
        break;
      }
    }
  } finally {
    flushInProgress = false;
  }
  return totalSent;
}
