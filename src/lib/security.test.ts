import { describe, expect, it } from 'vitest';

import { normalizeExternalUrl, sanitizeLogContext } from './security';

describe('security helpers', () => {
  it('allows http, https, mailto, and document anchors', () => {
    expect(normalizeExternalUrl('https://example.com/docs')).toBe('https://example.com/docs');
    expect(normalizeExternalUrl('mailto:help@example.com')).toBe('mailto:help@example.com');
    expect(normalizeExternalUrl('#markora-heading')).toBe('#markora-heading');
  });

  it('blocks executable and local URL schemes', () => {
    expect(normalizeExternalUrl('javascript:alert(1)')).toBeNull();
    expect(normalizeExternalUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
    expect(normalizeExternalUrl('file:///etc/passwd')).toBeNull();
  });

  it('redacts secrets, content, and file paths from log context', () => {
    expect(
      sanitizeLogContext({
        token: 'secret-token',
        documentContent: '# private note',
        path: '/Users/example/private.md',
        status: 'failed',
      }),
    ).toEqual({
      token: '[REDACTED]',
      documentContent: '[REDACTED]',
      path: '[REDACTED_PATH]',
      status: 'failed',
    });
  });
});
