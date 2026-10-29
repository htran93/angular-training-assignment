import { describe, expect, it } from 'vitest';

import { isJarType, JAR_TYPES } from './jar-type';

describe('isJarType', () => {
  it('accepts the canonical jar types and rejects unknown values', () => {
    for (const value of JAR_TYPES) {
      expect(isJarType(value)).toBe(true);
    }

    expect(isJarType('unrecognized')).toBe(false);
    expect(isJarType(null)).toBe(false);
  });
});
