import { describe, expect, it } from 'vitest';

import { getFindErrorTranslation } from './findErrors';

describe('find error translations', () => {
  it('maps bounded regex length errors with interpolation data', () => {
    expect(getFindErrorTranslation('Regex searches are limited to 160 characters.')).toEqual({
      key: 'regexTooLong',
      values: { limit: 160 },
    });
  });

  it('maps known validation errors to catalog keys', () => {
    expect(
      getFindErrorTranslation('Regex lookaround is disabled for predictable search performance.'),
    ).toEqual({ key: 'regexLookaroundDisabled' });
  });

  it('falls back without exposing an untranslated engine message', () => {
    expect(getFindErrorTranslation('Future validation rule')).toEqual({ key: 'invalidQuery' });
    expect(getFindErrorTranslation(null)).toBeNull();
  });
});
