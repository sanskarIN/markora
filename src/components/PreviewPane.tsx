import { MarkdownBody } from '../lib/markdown';

interface PreviewPaneProps {
  markdown: string;
  onOpenLink: (url: string) => void | Promise<void>;
}

export function PreviewPane({ markdown, onOpenLink }: PreviewPaneProps) {
  return (
    <section className="preview-pane" aria-label="Markdown preview">
      <div className="pane-header">
        <div className="pane-title">
          <span className="pane-kicker">Preview</span>
          <strong>Safe GFM rendering</strong>
        </div>
        <span className="security-pill" title="Raw HTML and unsafe URL schemes are blocked">
          Sanitized
        </span>
      </div>
      <article className="markdown-preview">
        {markdown.trim() ? (
          <MarkdownBody markdown={markdown} onOpenLink={onOpenLink} />
        ) : (
          <div className="empty-state">
            <strong>Nothing to preview yet</strong>
            <p>Start typing Markdown in the editor.</p>
          </div>
        )}
      </article>
    </section>
  );
}
