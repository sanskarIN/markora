import { describe, expect, it } from 'vitest';

import {
  BUILT_IN_EXPORT_TEMPLATES,
  exportTemplatePatch,
  parseExportTemplate,
  serializeExportTemplate,
} from './exportTemplates';

describe('export templates', () => {
  it('ships only version one bounded built-in templates', () => {
    expect(BUILT_IN_EXPORT_TEMPLATES.length).toBeGreaterThanOrEqual(3);
    for (const template of BUILT_IN_EXPORT_TEMPLATES) {
      expect(template.version).toBe(1);
      expect(template.print.marginMm).toBeGreaterThanOrEqual(5);
      expect(template.print.marginMm).toBeLessThanOrEqual(35);
    }
  });

  it('round trips a versioned template and produces a settings patch', () => {
    const template = parseExportTemplate(serializeExportTemplate(BUILT_IN_EXPORT_TEMPLATES[1]!));
    expect(template.id).toBe('compact-a4');
    expect(exportTemplatePatch(template)).toMatchObject({
      printPageSize: 'a4',
      printMarginMm: 12,
      printMetadata: false,
    });
  });

  it('normalizes untrusted template fields instead of accepting CSS-like values', () => {
    const template = parseExportTemplate(
      JSON.stringify({
        version: 1,
        id: ' custom\u0000id ',
        name: '  Example   Template ',
        print: {
          pageSize: 'url(https://example.com)',
          marginMm: 999,
          keepHeadings: 'yes',
          codeWrap: false,
          metadata: null,
        },
      }),
    );

    expect(template.id).toBe('custom id');
    expect(template.name).toBe('Example Template');
    expect(template.print.pageSize).toBe('auto');
    expect(template.print.marginMm).toBe(35);
    expect(template.print.keepHeadings).toBe(true);
    expect(template.print.codeWrap).toBe(false);
    expect(template.print.metadata).toBe(true);
  });

  it('rejects unsupported versions', () => {
    expect(() => parseExportTemplate('{"version":2,"print":{}}')).toThrow('Unsupported export template');
  });
});
