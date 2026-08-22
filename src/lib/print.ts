import type { EditorSettings, PrintPageSize } from '../types';

const PAGE_SIZE_CSS: Record<PrintPageSize, string> = {
  auto: 'auto',
  a4: 'A4',
  letter: 'Letter',
};

export function normalizePrintPageSize(value: unknown): PrintPageSize {
  return value === 'a4' || value === 'letter' || value === 'auto' ? value : 'auto';
}

export function normalizePrintMarginMm(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 18;
  return Math.min(35, Math.max(5, Math.round(value)));
}

export function buildPrintStyle(settings: Pick<
  EditorSettings,
  'printPageSize' | 'printMarginMm' | 'printKeepHeadings' | 'printCodeWrap' | 'printMetadata'
>): string {
  const pageSize = PAGE_SIZE_CSS[settings.printPageSize];
  const margin = normalizePrintMarginMm(settings.printMarginMm);
  const headingRule = settings.printKeepHeadings
    ? '.markdown-preview h1,.markdown-preview h2,.markdown-preview h3,.markdown-preview h4,.markdown-preview h5,.markdown-preview h6{break-after:avoid;page-break-after:avoid}'
    : '';
  const codeWhiteSpace = settings.printCodeWrap ? 'pre-wrap' : 'pre';
  const metadataDisplay = settings.printMetadata ? 'block' : 'none';

  return `@media print{@page{size:${pageSize};margin:${margin}mm}.markdown-preview pre{white-space:${codeWhiteSpace}!important}.print-metadata{display:${metadataDisplay}!important;margin:0 0 10mm;padding:0 0 5mm;border-bottom:1px solid #bbb;color:#333;font-family:ui-sans-serif,system-ui,sans-serif;font-size:9pt;line-height:1.4}.print-metadata strong{display:block;margin-bottom:1mm;color:#111;font-size:14pt}${headingRule}}`;
}
