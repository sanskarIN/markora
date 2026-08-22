import type { ComponentPropsWithoutRef, MouseEvent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';

import { normalizeExternalUrl } from './security';

const sanitizeSchema = {
  ...defaultSchema,
  clobberPrefix: 'markora-',
  attributes: {
    ...defaultSchema.attributes,
    code: [
      ...(defaultSchema.attributes?.code ?? []),
      ['className', /^language-./, 'hljs'],
    ],
    span: [
      ...(defaultSchema.attributes?.span ?? []),
      ['className', /^hljs-/],
    ],
    input: [
      ...(defaultSchema.attributes?.input ?? []),
      ['type', 'checkbox'],
      ['checked', true, false],
      ['disabled', true, false],
    ],
    li: [
      ...(defaultSchema.attributes?.li ?? []),
      ['className', 'task-list-item'],
    ],
    ul: [
      ...(defaultSchema.attributes?.ul ?? []),
      ['className', 'contains-task-list'],
    ],
  },
};

export function safeMarkdownUrl(url: string): string {
  const normalized = normalizeExternalUrl(url);
  return normalized ?? '';
}

interface MarkdownBodyProps {
  markdown: string;
  onOpenLink?: (url: string) => void | Promise<void>;
}

export function MarkdownBody({ markdown, onOpenLink }: MarkdownBodyProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSlug, rehypeHighlight, [rehypeSanitize, sanitizeSchema]]}
      urlTransform={safeMarkdownUrl}
      components={{
        a: ({ href, children, ...props }) => (
          <SafeLink href={href} onOpenLink={onOpenLink} {...props}>
            {children}
          </SafeLink>
        ),
        img: ({ alt }) => (
          <span className="blocked-image" role="img" aria-label={alt || 'Image'}>
            {alt ? `[Image: ${alt}]` : '[Image]'}
          </span>
        ),
      }}
    >
      {markdown}
    </ReactMarkdown>
  );
}

interface SafeLinkProps extends ComponentPropsWithoutRef<'a'> {
  onOpenLink?: (url: string) => void | Promise<void>;
}

function SafeLink({ href = '', children, onOpenLink, ...props }: SafeLinkProps) {
  const safeHref = safeMarkdownUrl(href);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (!safeHref) return;

    if (safeHref.startsWith('#')) {
      const target = document.getElementById(safeHref.slice(1));
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    void onOpenLink?.(safeHref);
  };

  return (
    <a
      {...props}
      href={safeHref || undefined}
      onClick={handleClick}
      rel="noopener noreferrer"
      referrerPolicy="no-referrer"
    >
      {children}
    </a>
  );
}

export function renderMarkdownDocument(markdown: string, title: string): string {
  const body = renderToStaticMarkup(<MarkdownBody markdown={markdown} />);
  const safeTitle = escapeHtml(title);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="referrer" content="no-referrer" />
<title>${safeTitle}</title>
<style>
:root{color-scheme:light dark;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}body{max-width:860px;margin:0 auto;padding:48px 24px;line-height:1.7;background:#fff;color:#18202b}h1,h2,h3,h4,h5,h6{line-height:1.25;margin-top:1.7em}a{color:#4b63d3}pre{overflow:auto;padding:16px;border-radius:10px;background:#111827;color:#e5e7eb}code{font-family:ui-monospace,"SFMono-Regular",Consolas,"Liberation Mono",Menlo,monospace}table{border-collapse:collapse;width:100%}th,td{border:1px solid #d7dce3;padding:8px 10px;text-align:left}blockquote{margin-left:0;padding-left:16px;border-left:4px solid #c7ccd5;color:#58606e}.blocked-image{display:inline-block;padding:4px 8px;border:1px dashed #aab1bc;border-radius:6px;color:#687180}@media(prefers-color-scheme:dark){body{background:#12151b;color:#e8ebf0}a{color:#9aabff}th,td{border-color:#3b4350}blockquote{border-color:#596579;color:#aeb6c4}}
</style>
</head>
<body>
${body}
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
