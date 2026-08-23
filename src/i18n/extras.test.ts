import { describe, expect, it } from 'vitest';

import { extraEn, extraHi } from './extras';
import { translate } from './index';

describe('extended locale catalog', () => {
  it('keeps Hindi and English extended keys aligned', () => {
    expect(Object.keys(extraHi).sort()).toEqual(Object.keys(extraEn).sort());
  });

  it('serves translated built-in workflow names', () => {
    expect(translate('en', 'standardDocument')).toBe('Standard document');
    expect(translate('hi', 'standardDocument')).not.toBe('Standard document');
  });
});
