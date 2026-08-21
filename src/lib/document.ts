import GithubSlugger from 'github-slugger';

import type { DocumentTab, HeadingItem } from '../types';

export const WELCOME_MARKDOWN = `# Welcome to Markora

A local-first Markdown editor built for focused writing.

## Start here

- Write Markdown in the editor.
- See a safe live preview beside it.
- Use **Ctrl/Cmd + K** for the command palette.
- Use **Ctrl/Cmd + F** for find and replace.

\`\`\`ts
const message = 'Made by the Sanskar';
console.log(message);
\`\`\`
`;

export function createDocument(
  content = '',
  title = 'Untitled',
  path: string | null = null,
): DocumentTab {
  const now = Date.now();
  return {
    id: createId(),
    title,
    path,
    content,
    savedContent: content,
    updatedAt: now,
    cursorLine: 1,
  };
}

export function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `markora-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function deriveFileName(path: string): string {
  const segments = path.replaceAll('\\', '/').split('/');
  return segments.at(-1) || 'Untitled.md';
}

export function ensureMarkdownExtension(name: string): string {
  return /\.(?:md|markdown|mdown|mkdn)$/i.test(name) ? name : `${name}.md`;
}

export function isDirty(tab: DocumentTab): boolean {
  return tab.content !== tab.savedContent;
}

export function getHeadings(markdown: string): HeadingItem[] {
  const headings: HeadingItem[] = [];
  const slugger = new GithubSlugger();
  const lines = markdown.split(/\r?\n/);
  let fence: { marker: '`' | '~'; length: number } | null = null;

  lines.forEach((line, index) => {
    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);
    if (fenceMatch?.[1]) {
      const markerText = fenceMatch[1];
      const marker = markerText[0] as '`' | '~';
      if (fence === null) {
        fence = { marker, length: markerText.length };
      } else if (fence.marker === marker && markerText.length >= fence.length) {
        fence = null;
      }
      return;
    }

    if (fence !== null) return;

    const match = line.match(/^(#{1,6})[ \t]+(.+?)[ \t]*#*[ \t]*$/);
    if (!match?.[1] || !match[2]) return;

    const text = match[2].trim();
    headings.push({
      id: `markora-${slugger.slug(text)}`,
      level: match[1].length,
      text,
      line: index + 1,
    });
  });

  return headings;
}

export function getBreadcrumb(headings: HeadingItem[], cursorLine: number): HeadingItem[] {
  const stack: HeadingItem[] = [];

  for (const heading of headings) {
    if (heading.line > cursorLine) break;
    while (stack.length > 0 && (stack.at(-1)?.level ?? 0) >= heading.level) {
      stack.pop();
    }
    stack.push(heading);
  }

  return stack;
}

export function getCursorLine(content: string, selectionStart: number): number {
  const safePosition = Math.max(0, Math.min(selectionStart, content.length));
  return content.slice(0, safePosition).split('\n').length;
}

export function getWordStats(content: string): { words: number; characters: number; lines: number } {
  const matches = content.match(/[\p{L}\p{N}]+(?:['’_-][\p{L}\p{N}]+)*/gu);
  return {
    words: matches?.length ?? 0,
    characters: [...content].length,
    lines: content.length === 0 ? 1 : content.split(/\r?\n/).length,
  };
}

export interface FindOptions {
  matchCase: boolean;
  wholeWord?: boolean;
  useRegex?: boolean;
}

export interface TextMatch {
  start: number;
  end: number;
}

const MAX_REGEX_QUERY_LENGTH = 160;
const MAX_REGEX_DOCUMENT_LENGTH = 2_000_000;
const WORD_CHARACTER = /[\p{L}\p{N}_]/u;

export function getFindQueryError(
  query: string,
  options: FindOptions,
  contentLength = 0,
): string | null {
  if (!options.useRegex || !query) return null;
  if (query.length > MAX_REGEX_QUERY_LENGTH) {
    return `Regex searches are limited to ${MAX_REGEX_QUERY_LENGTH} characters.`;
  }
  if (contentLength > MAX_REGEX_DOCUMENT_LENGTH) {
    return 'Regex mode is disabled for documents larger than 2 MB.';
  }
  if (/\\[1-9]/.test(query)) return 'Regex backreferences are disabled for predictable search performance.';
  if (/\(\?[=!<]/.test(query)) return 'Regex lookaround is disabled for predictable search performance.';
  if (/\((?:[^()\\]|\\.)*[+*{][^()]*\)\s*[+*{]/.test(query)) {
    return 'Nested quantified groups are disabled for predictable search performance.';
  }

  try {
    const regex = new RegExp(query, options.matchCase ? 'gu' : 'giu');
    if (regex.test('')) return 'Regex patterns that can match empty text are not supported.';
  } catch {
    return 'Invalid regular expression.';
  }
  return null;
}

export function findMatches(content: string, query: string, options: FindOptions): TextMatch[] {
  if (!query || getFindQueryError(query, options, content.length)) return [];

  if (!options.useRegex) {
    return findLiteralMatches(content, query, options);
  }

  const regex = new RegExp(query, options.matchCase ? 'gu' : 'giu');
  const matches: TextMatch[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    const text = match[0];
    const candidate = { start: match.index, end: match.index + text.length };
    if (!options.wholeWord || isWholeWord(content, candidate)) matches.push(candidate);
    if (matches.length >= 10_000) break;
  }

  return matches;
}

function findLiteralMatches(content: string, query: string, options: FindOptions): TextMatch[] {
  const haystack = options.matchCase ? content : content.toLocaleLowerCase();
  const needle = options.matchCase ? query : query.toLocaleLowerCase();
  const matches: TextMatch[] = [];
  let cursor = 0;

  while (cursor <= haystack.length - needle.length) {
    const index = haystack.indexOf(needle, cursor);
    if (index === -1) break;
    const candidate = { start: index, end: index + query.length };
    if (!options.wholeWord || isWholeWord(content, candidate)) matches.push(candidate);
    if (matches.length >= 10_000) break;
    cursor = index + Math.max(1, needle.length);
  }

  return matches;
}

function isWholeWord(content: string, match: TextMatch): boolean {
  const before = match.start > 0 ? content.slice(match.start - 1, match.start) : '';
  const after = match.end < content.length ? content.slice(match.end, match.end + 1) : '';
  return (!before || !WORD_CHARACTER.test(before)) && (!after || !WORD_CHARACTER.test(after));
}

export function replaceMatch(
  content: string,
  match: TextMatch,
  replacement: string,
): { content: string; selectionStart: number; selectionEnd: number } {
  const next = `${content.slice(0, match.start)}${replacement}${content.slice(match.end)}`;
  const caret = match.start + replacement.length;
  return { content: next, selectionStart: caret, selectionEnd: caret };
}

export function replaceAllMatches(
  content: string,
  query: string,
  replacement: string,
  options: FindOptions,
): { content: string; count: number } {
  const matches = findMatches(content, query, options);
  if (matches.length === 0) return { content, count: 0 };

  let cursor = 0;
  let output = '';
  for (const match of matches) {
    output += content.slice(cursor, match.start);
    output += replacement;
    cursor = match.end;
  }
  output += content.slice(cursor);
  return { content: output, count: matches.length };
}
