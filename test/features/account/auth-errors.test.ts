import { describe, expect, it } from 'vitest';

import { authErrorFromUnknown, formatAuthErrorMessage } from '@/features/account/lib/auth-errors';
import { ApiRequestError } from '@/lib/api-errors';

const t = (key: string, options?: Record<string, string>) =>
  options?.defaultValue && key === 'authErrorUnknown' ? options.defaultValue : `[${key}]`;

describe('authErrorFromUnknown', () => {
  it('maps email_taken to the email field', () => {
    const error = new ApiRequestError(400, '', { code: 'email_taken', message: 'Taken' });
    expect(authErrorFromUnknown(error)).toEqual({ code: 'email_taken', message: 'Taken', field: 'email' });
  });

  it('maps invalid_credentials to the password field', () => {
    const error = new ApiRequestError(401, '', { code: 'invalid_credentials' });
    expect(authErrorFromUnknown(error).field).toBe('password');
  });

  it('keeps the API field for validation errors', () => {
    const error = new ApiRequestError(400, '', {
      code: 'validation_error',
      message: 'Too short',
      field: 'password',
    });
    expect(authErrorFromUnknown(error)).toEqual({
      code: 'validation_error',
      message: 'Too short',
      field: 'password',
    });
  });

  it('recognises fetch network failures', () => {
    expect(authErrorFromUnknown(new TypeError('Network request failed'))).toEqual({
      code: 'network',
      field: null,
    });
  });

  it('falls back to unknown', () => {
    expect(authErrorFromUnknown('boom')).toEqual({ code: 'unknown', message: undefined, field: null });
  });
});

describe('formatAuthErrorMessage', () => {
  it('uses the i18n key for known codes', () => {
    expect(formatAuthErrorMessage({ code: 'email_taken', field: 'email' }, t)).toBe(
      '[authErrorEmailTaken]',
    );
  });

  it('shows the server message verbatim for validation errors', () => {
    expect(
      formatAuthErrorMessage({ code: 'validation_error', message: 'Too short', field: 'password' }, t),
    ).toBe('Too short');
  });

  it('falls back to the unknown key when nothing better exists', () => {
    expect(formatAuthErrorMessage({ code: 'weird', field: null }, t)).toBe('[authErrorUnknown]');
  });
});
