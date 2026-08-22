import { describe, expect, it } from 'vitest';

import { buildPrintStyle, normalizePrintMarginMm, normalizePrintPageSize } from './print';

describe('print settings', () => {
  it('normalizes page sizes and clamps margins', () => {
    expect(normalizePrintPageSize('a4')).toBe('a4');
    expect(normalizePrintPageSize('ledger')).toBe('auto');
    expect(normalizePrintMarginMm(-20)).toBe(5);
    expect(normalizePrintMarginMm(120)).toBe(35);
    expect(normalizePrintMarginMm(Number.NaN)).toBe(18);
  });

  it('builds deterministic print-only CSS from typed settings', () => {
    const css = buildPrintStyle({
      printPageSize: 'letter',
      printMarginMm: 22,
      printKeepHeadings: true,
      printCodeWrap: false,
      printMetadata: false,
    });

    expect(css).toContain('@media print');
    expect(css).toContain('size:Letter');
    expect(css).toContain('margin:22mm');
    expect(css).toContain('white-space:pre!important');
    expect(css).toContain('.print-metadata{display:none!important}');
    expect(css).toContain('break-after:avoid');
    expect(css).not.toMatch(/https?:|url\s*\(/i);
  });
});
