import { describe, expect, it } from 'vitest';

import {
  findMatches,
  getBreadcrumb,
  getHeadings,
  getWordStats,
  replaceAllMatches,
  replaceMatch,
} from './document';

describe('document utilities', () => {
  it('extracts headings with sanitized preview-compatible ids', () => {
    const headings = getHeadings('# Hello World\n\n## Details\n\n# Hello World');
    expect(headings).toEqual([
      { id: 'markora-hello-world', level: 1, text: 'Hello World', line: 1 },
      { id: 'markora-details', level: 2, text: 'Details', line: 3 },
      { id: 'markora-hello-world-1', level: 1, text: 'Hello World', line: 5 },
    ]);
  });

  it('ignores heading-like text inside fenced code blocks', () => {
    const headings = getHeadings('# Real\n```md\n# Not a heading\n```\n## Also real');
    expect(headings.map((heading) => heading.text)).toEqual(['Real', 'Also real']);
  });

  it('builds a heading breadcrumb for the cursor line', () => {
    const headings = getHeadings('# A\ntext\n## B\ntext\n### C\ntext\n## D');
    expect(getBreadcrumb(headings, 6).map((heading) => heading.text)).toEqual(['A', 'B', 'C']);
    expect(getBreadcrumb(headings, 7).map((heading) => heading.text)).toEqual(['A', 'D']);
  });

  it('counts unicode words and characters', () => {
    const stats = getWordStats('Hello नमस्ते 123');
    expect(stats.words).toBe(3);
    expect(stats.lines).toBe(1);
    expect(stats.characters).toBeGreaterThan(10);
  });

  it('finds case-insensitive matches and replaces one', () => {
    const matches = findMatches('Markora MARKORA', 'markora', { matchCase: false });
    expect(matches).toHaveLength(2);
    expect(replaceMatch('Markora MARKORA', matches[0]!, 'Editor').content).toBe('Editor MARKORA');
  });

  it('replaces all matches without interpreting replacement metacharacters', () => {
    const result = replaceAllMatches('a.a.a', '.', '$&', { matchCase: true });
    expect(result).toEqual({ content: 'a$&a$&a', count: 2 });
  });
});
