import { describe, expect, it } from 'vitest';

import { normalizeLocale, SUPPORTED_LOCALES, translate } from './index';

describe('i18n runtime', () => {
  it('normalizes unsupported locales to English', () => {
    expect(normalizeLocale('hi')).toBe('hi');
    expect(normalizeLocale('en')).toBe('en');
    expect(normalizeLocale('fr')).toBe('en');
    expect(normalizeLocale(null)).toBe('en');
  });

  it('exposes the supported locale list', () => {
    expect(SUPPORTED_LOCALES).toEqual(['en', 'hi']);
  });

  it('interpolates translated values without eval-like behavior', () => {
    expect(translate('en', 'lineNumber', { line: 42 })).toBe('Line 42');
    expect(translate('hi', 'lineNumber', { line: 42 })).toContain('42');
  });

  it('leaves unknown interpolation tokens visible for diagnostics', () => {
    expect(translate('en', 'lineNumber')).toBe('Line {line}');
  });
});
