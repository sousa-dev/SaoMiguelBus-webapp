/** Days until `iso` (rounded up), or null when it is in the past or missing. */
export function daysRemaining(iso: string | null | undefined, now = Date.now()): number | null {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - now;
  if (Number.isNaN(diff) || diff <= 0) return null;
  return Math.ceil(diff / (24 * 60 * 60 * 1000));
}
