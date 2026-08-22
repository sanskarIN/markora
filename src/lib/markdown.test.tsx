import { describe, expect, it } from 'vitest';

import { renderMarkdownDocument, safeMarkdownUrl } from './markdown';

describe('markdown rendering', () => {
  it('keeps approved links and blocks executable schemes', () => {
    expect(safeMarkdownUrl('https://example.com/docs')).toBe('https://example.com/docs');
    expect(safeMarkdownUrl('javascript:alert(1)')).toBe('');
  });

  it('exports a complete sanitized HTML document', () => {
    const html = renderMarkdownDocument(
      '# Exported\n\n<script>alert(1)</script>\n\n[docs](https://example.com)',
      'Example <Title>',
    );

    expect(html).toContain('<!doctype html>');
    expect(html).toContain('<title>Example &lt;Title&gt;</title>');
    expect(html).toContain('<h1 id="markora-exported">Exported</h1>');
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('alert(1)</script>');
  });

  it('keeps export styling self contained and local only', () => {
    const html = renderMarkdownDocument('# Offline export', 'Offline');

    expect(html).toContain('<style>');
    expect(html).toContain('font-family:ui-sans-serif,system-ui');
    expect(html).not.toMatch(/<link\b/i);
    expect(html).not.toMatch(/<script\b[^>]*\bsrc=/i);
    expect(html).not.toMatch(/@import\s+/i);
    expect(html).not.toMatch(/url\s*\(\s*["']?https?:/i);
  });

  it('does not emit remote image requests in exported content', () => {
    const html = renderMarkdownDocument('![Private](https://example.com/tracker.png)', 'Images');
    expect(html).not.toContain('<img');
    expect(html).toContain('[Image: Private]');
  });
});
