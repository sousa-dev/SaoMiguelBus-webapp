/**
 * Split out of `lib/api.ts` so modules that only need to CLASSIFY a failure —
 * `features/transit/lib/journey-fallback.ts` and its tests — can import it
 * without pulling in the whole fetch layer, and without an import cycle.
 */

/** Parsed body from a failed `apiFetch` (v3 envelope or DRF field errors). Mirrors the Expo client. */
export type ApiErrorPayload = {
  code: string;
  message?: string;
  field?: string;
};

/** Structured error mirroring the Expo client's ApiRequestError. */
export class ApiRequestError extends Error {
  status: number;
  body: string;
  parsed: ApiErrorPayload;

  constructor(status: number, body: string, parsed?: ApiErrorPayload) {
    super(`API ${status}`);
    this.name = 'ApiRequestError';
    this.status = status;
    this.body = body;
    this.parsed = parsed ?? parseApiErrorBody(body);
  }
}

export function parseApiErrorBody(body: string): ApiErrorPayload {
  try {
    const json = JSON.parse(body) as Record<string, unknown>;
    const envelope = json.error;
    if (envelope && typeof envelope === 'object' && !Array.isArray(envelope)) {
      const err = envelope as { code?: string; message?: string };
      return {
        code: err.code ?? 'unknown',
        message: typeof err.message === 'string' ? err.message : undefined,
      };
    }

    const fieldErrors: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(json)) {
      if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
        fieldErrors[key] = value;
      }
    }
    if (Object.keys(fieldErrors).length > 0) {
      const field = Object.keys(fieldErrors)[0];
      return {
        code: 'validation_error',
        message: fieldErrors[field][0],
        field,
      };
    }
  } catch {
    // Non-JSON body (HTML proxy errors, etc.)
  }

  const trimmed = body.trim();
  return {
    code: 'unknown',
    message: trimmed ? trimmed.slice(0, 300) : undefined,
  };
}
