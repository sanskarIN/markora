# ADR-0002: Sanitized Markdown rendering boundary

**Status:** Accepted

## Context

Markdown documents can contain untrusted links, HTML-like content, images, code, and malformed input. A live preview that directly injects generated HTML into the webview could create script execution, unsafe navigation, remote tracking requests, or DOM-clobbering risks.

## Decision

All preview/export Markdown rendering uses the constrained React Markdown pipeline in `src/lib/markdown.tsx`:

- GitHub-Flavored Markdown is parsed with `remark-gfm`.
- Heading identifiers are generated with a clobber-safe prefix.
- Syntax highlighting runs before sanitization using an explicitly allowed class subset.
- `rehype-sanitize` enforces an allow-listed schema.
- Raw Markdown HTML is not trusted as executable DOM.
- URL transforms reject unapproved schemes.
- External links open only after explicit user interaction through the validated platform boundary.
- Markdown images are represented as blocked-image text rather than fetched automatically.
- HTML export uses the same sanitized renderer and inline local styles.

## Consequences

### Benefits

- Preview and export share one security model.
- A document cannot rely on arbitrary scripts/styles/iframes to render.
- Remote image tracking is avoided by default.
- Security behavior can be regression-tested in pure/component tests.

### Tradeoffs

- Some Markdown HTML extensions intentionally do not render.
- Remote images do not appear automatically.
- Rich plugin ecosystems that require arbitrary HTML execution are outside the default architecture.
- Sanitizer schema changes require careful review when adding supported Markdown features.

## Security requirements

Any change to renderer plugins, sanitizer attributes, URL handling, HTML export, image behavior, or heading IDs must include regression coverage for dangerous input. Do not bypass sanitization for performance or compatibility convenience.

## Revisit when

Add a new ADR if Markora introduces an explicitly sandboxed rich-content/plugin model whose execution boundary differs from the current sanitizer-first renderer.
