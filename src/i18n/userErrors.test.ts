import { describe, expect, it } from 'vitest';

import { translate } from './index';
import { localizeUserError } from './userErrors';

const en = (key: Parameters<typeof translate>[1], values?: Parameters<typeof translate>[2]) =>
  translate('en', key, values);
const hi = (key: Parameters<typeof translate>[1], values?: Parameters<typeof translate>[2]) =>
  translate('hi', key, values);

describe('localized user error boundary', () => {
  it('translates safe known validation errors', () => {
    const error = new Error('The dropped file is not valid UTF-8 text.');
    expect(localizeUserError(error, en)).toBe('The dropped file is not valid UTF-8 text.');
    expect(localizeUserError(error, hi)).not.toBe(error.message);
  });

  it('maps malformed backup JSON to a safe backup message', () => {
    expect(localizeUserError(new SyntaxError('Unexpected token'), en)).toBe(
      'This is not a valid Markora backup file.',
    );
  });

  it('does not leak unknown native or internal error messages', () => {
    const secret = 'native failure at /private/example/document.md';
    const message = localizeUserError(new Error(secret), en);
    expect(message).toBe('An unexpected error occurred.');
    expect(message).not.toContain('/private/example');
  });
});
