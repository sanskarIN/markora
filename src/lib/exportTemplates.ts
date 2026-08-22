import type { EditorSettings, PrintPageSize } from '../types';
import { normalizePrintMarginMm, normalizePrintPageSize } from './print';

export interface ExportTemplateV1 {
  version: 1;
  id: string;
  name: string;
  print: {
    pageSize: PrintPageSize;
    marginMm: number;
    keepHeadings: boolean;
    codeWrap: boolean;
    metadata: boolean;
  };
}

export const BUILT_IN_EXPORT_TEMPLATES: readonly ExportTemplateV1[] = [
  {
    version: 1,
    id: 'standard',
    name: 'Standard document',
    print: { pageSize: 'auto', marginMm: 18, keepHeadings: true, codeWrap: true, metadata: true },
  },
  {
    version: 1,
    id: 'compact-a4',
    name: 'Compact A4',
    print: { pageSize: 'a4', marginMm: 12, keepHeadings: true, codeWrap: true, metadata: false },
  },
  {
    version: 1,
    id: 'code-review',
    name: 'Code review',
    print: { pageSize: 'a4', marginMm: 15, keepHeadings: true, codeWrap: false, metadata: true },
  },
  {
    version: 1,
    id: 'letter-report',
    name: 'US Letter report',
    print: { pageSize: 'letter', marginMm: 20, keepHeadings: true, codeWrap: true, metadata: true },
  },
] as const;

export function exportTemplatePatch(template: ExportTemplateV1): Partial<EditorSettings> {
  return {
    printPageSize: normalizePrintPageSize(template.print.pageSize),
    printMarginMm: normalizePrintMarginMm(template.print.marginMm),
    printKeepHeadings: template.print.keepHeadings,
    printCodeWrap: template.print.codeWrap,
    printMetadata: template.print.metadata,
  };
}

export function serializeExportTemplate(template: ExportTemplateV1): string {
  return JSON.stringify(normalizeExportTemplate(template), null, 2);
}

export function parseExportTemplate(raw: string): ExportTemplateV1 {
  if (new Blob([raw]).size > 32 * 1024) throw new Error('Export template is too large.');
  const parsed: unknown = JSON.parse(raw);
  if (!isRecord(parsed) || parsed.version !== 1 || !isRecord(parsed.print)) {
    throw new Error('Unsupported export template.');
  }

  return normalizeExportTemplate({
    version: 1,
    id: normalizeText(parsed.id, 'custom-template', 64),
    name: normalizeText(parsed.name, 'Custom export template', 80),
    print: {
      pageSize: normalizePrintPageSize(parsed.print.pageSize),
      marginMm: normalizePrintMarginMm(parsed.print.marginMm),
      keepHeadings: normalizeBoolean(parsed.print.keepHeadings, true),
      codeWrap: normalizeBoolean(parsed.print.codeWrap, true),
      metadata: normalizeBoolean(parsed.print.metadata, true),
    },
  });
}

function normalizeExportTemplate(template: ExportTemplateV1): ExportTemplateV1 {
  return {
    version: 1,
    id: normalizeText(template.id, 'custom-template', 64),
    name: normalizeText(template.name, 'Custom export template', 80),
    print: {
      pageSize: normalizePrintPageSize(template.print.pageSize),
      marginMm: normalizePrintMarginMm(template.print.marginMm),
      keepHeadings: Boolean(template.print.keepHeadings),
      codeWrap: Boolean(template.print.codeWrap),
      metadata: Boolean(template.print.metadata),
    },
  };
}

function normalizeBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function normalizeText(value: unknown, fallback: string, maxLength: number): string {
  if (typeof value !== 'string') return fallback;
  const normalized = value.trim().replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ');
  return normalized.slice(0, maxLength) || fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
