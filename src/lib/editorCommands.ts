export type MarkdownCommand =
  | 'bold'
  | 'italic'
  | 'inline-code'
  | 'heading'
  | 'quote'
  | 'bullet-list'
  | 'ordered-list'
  | 'task-list'
  | 'code-block'
  | 'link';

export interface EditorTransform {
  content: string;
  selectionStart: number;
  selectionEnd: number;
}

interface SelectionContext {
  start: number;
  end: number;
  selected: string;
}

export function applyMarkdownCommand(
  content: string,
  selectionStart: number,
  selectionEnd: number,
  command: MarkdownCommand,
): EditorTransform {
  const selection = normalizeSelection(content, selectionStart, selectionEnd);

  switch (command) {
    case 'bold':
      return wrapSelection(content, selection, '**', '**', 'bold text');
    case 'italic':
      return wrapSelection(content, selection, '*', '*', 'italic text');
    case 'inline-code':
      return wrapSelection(content, selection, '`', '`', 'code');
    case 'link':
      return createLink(content, selection);
    case 'heading':
      return transformSelectedLines(content, selection, toggleHeading);
    case 'quote':
      return transformSelectedLines(content, selection, (lines) => toggleLinePrefix(lines, '> '));
    case 'bullet-list':
      return transformSelectedLines(content, selection, (lines) => toggleLinePrefix(lines, '- '));
    case 'task-list':
      return transformSelectedLines(content, selection, (lines) => toggleLinePrefix(lines, '- [ ] '));
    case 'ordered-list':
      return transformSelectedLines(content, selection, toggleOrderedList);
    case 'code-block':
      return toggleCodeBlock(content, selection);
    default:
      return { content, selectionStart: selection.start, selectionEnd: selection.end };
  }
}

function normalizeSelection(content: string, selectionStart: number, selectionEnd: number): SelectionContext {
  const first = clamp(Math.min(selectionStart, selectionEnd), 0, content.length);
  const last = clamp(Math.max(selectionStart, selectionEnd), first, content.length);
  return { start: first, end: last, selected: content.slice(first, last) };
}

function wrapSelection(
  content: string,
  selection: SelectionContext,
  before: string,
  after: string,
  placeholder: string,
): EditorTransform {
  const body = selection.selected || placeholder;
  const replacement = `${before}${body}${after}`;
  const next = replaceRange(content, selection.start, selection.end, replacement);
  const bodyStart = selection.start + before.length;
  return {
    content: next,
    selectionStart: bodyStart,
    selectionEnd: bodyStart + body.length,
  };
}

function createLink(content: string, selection: SelectionContext): EditorTransform {
  const label = selection.selected || 'link text';
  const url = 'https://';
  const replacement = `[${label}](${url})`;
  const next = replaceRange(content, selection.start, selection.end, replacement);
  const urlStart = selection.start + label.length + 3;
  return {
    content: next,
    selectionStart: urlStart,
    selectionEnd: urlStart + url.length,
  };
}

function transformSelectedLines(
  content: string,
  selection: SelectionContext,
  transform: (lines: string[]) => string[],
): EditorTransform {
  const range = getLineRange(content, selection.start, selection.end);
  const original = content.slice(range.start, range.end);
  const lines = original.split('\n');
  const replacement = transform(lines).join('\n');
  return {
    content: replaceRange(content, range.start, range.end, replacement),
    selectionStart: range.start,
    selectionEnd: range.start + replacement.length,
  };
}

function toggleHeading(lines: string[]): string[] {
  const meaningful = lines.filter((line) => line.trim().length > 0);
  const allHeadings = meaningful.length > 0 && meaningful.every((line) => /^#{1,6}\s+/.test(line));

  return lines.map((line) => {
    if (!line.trim()) return line;
    if (allHeadings) return line.replace(/^#{1,6}\s+/, '');
    return line.replace(/^#{1,6}\s+/, '').replace(/^/, '## ');
  });
}

function toggleLinePrefix(lines: string[], prefix: string): string[] {
  const meaningful = lines.filter((line) => line.trim().length > 0);
  const allPrefixed = meaningful.length > 0 && meaningful.every((line) => line.startsWith(prefix));

  return lines.map((line) => {
    if (!line.trim()) return line;
    return allPrefixed ? line.slice(prefix.length) : `${prefix}${line}`;
  });
}

function toggleOrderedList(lines: string[]): string[] {
  const meaningful = lines.filter((line) => line.trim().length > 0);
  const allOrdered = meaningful.length > 0 && meaningful.every((line) => /^\d+\.\s+/.test(line));
  let counter = 0;

  return lines.map((line) => {
    if (!line.trim()) return line;
    if (allOrdered) return line.replace(/^\d+\.\s+/, '');
    counter += 1;
    return `${counter}. ${line.replace(/^\d+\.\s+/, '')}`;
  });
}

function toggleCodeBlock(content: string, selection: SelectionContext): EditorTransform {
  const range = getLineRange(content, selection.start, selection.end);
  const block = content.slice(range.start, range.end);
  const fenced = block.match(/^```(?:[^\n]*)\n([\s\S]*?)\n```$/);

  if (fenced) {
    const replacement = fenced[1] ?? '';
    return {
      content: replaceRange(content, range.start, range.end, replacement),
      selectionStart: range.start,
      selectionEnd: range.start + replacement.length,
    };
  }

  const body = block || 'code';
  const replacement = `\`\`\`\n${body}\n\`\`\``;
  return {
    content: replaceRange(content, range.start, range.end, replacement),
    selectionStart: range.start + 4,
    selectionEnd: range.start + 4 + body.length,
  };
}

function getLineRange(content: string, start: number, end: number): { start: number; end: number } {
  const lineStart = content.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
  const newlineAfterEnd = content.indexOf('\n', end);
  const lineEnd = newlineAfterEnd === -1 ? content.length : newlineAfterEnd;
  return { start: lineStart, end: lineEnd };
}

function replaceRange(content: string, start: number, end: number, replacement: string): string {
  return `${content.slice(0, start)}${replacement}${content.slice(end)}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
