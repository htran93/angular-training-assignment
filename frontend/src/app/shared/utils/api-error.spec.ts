import { describe, expect, it } from 'vitest';

import { getApiErrorCode } from './api-error';

describe('getApiErrorCode', () => {
  it('returns a string API error code from an object payload', () => {
    expect(getApiErrorCode({ code: 'MONTHLY_PLAN_NOT_FOUND' })).toBe('MONTHLY_PLAN_NOT_FOUND');
  });

  it('returns null for malformed or missing error payloads', () => {
    for (const value of [null, [], 'not an error object', {}, { code: 404 }]) {
      expect(getApiErrorCode(value)).toBeNull();
    }
  });
});
