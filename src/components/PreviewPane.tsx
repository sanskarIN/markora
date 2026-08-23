import { useI18n } from '../i18n';
import { getHeadings } from '../lib/document';
import { MarkdownBody } from '../lib/markdown';

interface PreviewPaneProps {
  markdown: string;
  fontFamily?: string;
  onOpenLink: (url: string) => void | Promise<void>;
}

export function PreviewPane({ markdown, fontFamily, onOpenLink }: PreviewPaneProps) {
  const { t } = useI18n();
  const resolvedFontFamily =
    fontFamily ?? 'var(--writing-font, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif)';
  const printTitle = getHeadings(markdown)[0]?.text || t('markdownDocument');
  const printDate = new Date().toLocaleDateString();

  return (
    <section className="preview-pane" aria-label={t('markdownPreview')}>
      <div className="pane-header">
        <div className="pane-title">
          <span className="pane-kicker">{t('preview')}</span>
          <strong>{t('safeGfmRendering')}</strong>
        </div>
        <span className="security-pill" title={t('sanitizedTitle')}>
          {t('sanitized')}
        </span>
      </div>
      <article className="markdown-preview" style={{ fontFamily: resolvedFontFamily }}>
        <aside className="print-metadata" aria-hidden="true" style={{ display: 'none' }}>
          <strong>{printTitle}</strong>
          <span>{t('printedFromMarkora', { date: printDate })}</span>
        </aside>
        {markdown.trim() ? (
          <MarkdownBody markdown={markdown} onOpenLink={onOpenLink} />
        ) : (
          <div className="empty-state">
            <strong>{t('nothingToPreview')}</strong>
            <p>{t('startTypingMarkdown')}</p>
          </div>
        )}
      </article>
    </section>
  );
}
