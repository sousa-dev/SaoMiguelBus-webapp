/**
 * Split out of `lib/api.ts` so modules that only need to CLASSIFY a failure —
 * `features/transit/lib/journey-fallback.ts` and its tests — can import it
 * without pulling in the whole fetch layer, and without an import cycle.
 */

/** Structured error mirroring the Expo client's ApiRequestError. */
export class ApiRequestError extends Error {
  status: number;
  body: string;

  constructor(status: number, body: string) {
    super(`API ${status}`);
    this.name = 'ApiRequestError';
    this.status = status;
    this.body = body;
  }
}
