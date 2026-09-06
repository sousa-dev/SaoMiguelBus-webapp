import type { PinnedRoute } from '@/features/transit/tracking/tracking-types';

export type Translate = (key: string, params?: Record<string, unknown>) => string;

/** `09h15 · 1 change at Lagoa · arrives 10h21` — a pin has to show its shape. */
export function pinShape(pin: PinnedRoute, t: Translate): string {
  const legs = pin.legs ?? [];
  const parts: string[] = [];
  const departure = legs[0]?.start;
  const arrival = legs[legs.length - 1]?.end;
  if (departure) parts.push(departure);
  if (pin.transfers?.length) {
    parts.push(
      t('transitPinnedChanges', {
        count: pin.transfers.length,
        at: pin.transfers.map((x) => x.at).join(', '),
      }),
    );
  } else if (legs.length === 1) {
    parts.push(t('transitPinnedDirect'));
  }
  if (arrival) parts.push(t('transitPinnedArrives', { time: arrival }));
  return parts.join(' · ');
}
