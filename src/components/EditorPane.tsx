import { forwardRef } from 'react';

import { useI18n } from '../i18n';
import { getCursorLine } from '../lib/document';
import type { HeadingItem } from '../types';

interface EditorPaneProps {
  title: string;
  content: string;
  breadcrumbs: HeadingItem[];
  fontFamily?: string;
  fontSize: number;
  lineHeight: number;
  wordWrap: boolean;
  onChange: (content: string) => void;
  onCursorLineChange: (line: number) => void;
}

export const EditorPane = forwardRef<HTMLTextAreaElement, EditorPaneProps>(function EditorPane(
  {
    title,
    content,
    breadcrumbs,
    fontFamily,
    fontSize,
    lineHeight,
    wordWrap,
    onChange,
    onCursorLineChange,
  },
  ref,
) {
  const { t } = useI18n();
  const updateCursor = (target: HTMLTextAreaElement) => {
    onCursorLineChange(getCursorLine(target.value, target.selectionStart));
  };
  const resolvedFontFamily =
    fontFamily ??
    'var(--writing-font, ui-monospace, "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace)';

  return (
    <section className="editor-pane" aria-label={t('markdownEditor')}>
      <div className="pane-header">
        <div className="pane-title">
          <span className="pane-kicker">{t('editor')}</span>
          <strong>{title}</strong>
        </div>
        <nav className="breadcrumbs" aria-label={t('headingBreadcrumbs')}>
          {breadcrumbs.length ? (
            breadcrumbs.map((heading, index) => (
              <span key={`${heading.line}-${heading.id}`}>
                {index > 0 ? <span aria-hidden="true"> / </span> : null}
                <span>{heading.text}</span>
              </span>
            ))
          ) : (
            <span>{t('documentRoot')}</span>
          )}
        </nav>
      </div>

      <textarea
        ref={ref}
        className="markdown-editor"
        aria-label={t('markdownSource')}
        autoCapitalize="sentences"
        autoCorrect="on"
        spellCheck="true"
        value={content}
        wrap={wordWrap ? 'soft' : 'off'}
        style={{ fontFamily: resolvedFontFamily, fontSize: `${fontSize}px`, lineHeight }}
        onChange={(event) => onChange(event.target.value)}
        onClick={(event) => updateCursor(event.currentTarget)}
        onKeyUp={(event) => updateCursor(event.currentTarget)}
        onSelect={(event) => updateCursor(event.currentTarget)}
      />
    </section>
  );
});
