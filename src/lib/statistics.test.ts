import { describe, expect, it } from 'vitest';

import { getDocumentStatistics } from './statistics';

describe('getDocumentStatistics', () => {
  it('counts structural Markdown elements without counting fenced content as lists', () => {
    const markdown = `# Title

A paragraph with [a link](https://example.com).

- one
- [ ] task
1. numbered

\`\`\`md
- not a real list
\`\`\`
`;

    const stats = getDocumentStatistics(markdown);

    expect(stats.headings).toBe(1);
    expect(stats.links).toBe(1);
    expect(stats.listItems).toBe(3);
    expect(stats.taskItems).toBe(1);
    expect(stats.codeBlocks).toBe(1);
    expect(stats.paragraphs).toBeGreaterThanOrEqual(4);
    expect(stats.readingMinutes).toBe(1);
  });

  it('returns zero reading time for an empty document', () => {
    const stats = getDocumentStatistics('');
    expect(stats.words).toBe(0);
    expect(stats.readingMinutes).toBe(0);
  });
});
