import { describe, expect, it } from 'vitest';

import { filterOutline, getOutlineWindow } from './outline';
import type { HeadingItem } from '../types';

const headings: HeadingItem[] = [
  { id: 'a', level: 1, text: 'Introduction', line: 1 },
  { id: 'b', level: 2, text: 'Security model', line: 20 },
  { id: 'c', level: 3, text: 'Recovery details', line: 42 },
];

describe('outline helpers', () => {
  it('filters by heading text, level, and line number', () => {
    expect(filterOutline(headings, 'security')).toEqual([headings[1]]);
    expect(filterOutline(headings, 'h3')).toEqual([headings[2]]);
    expect(filterOutline(headings, '42')).toEqual([headings[2]]);
  });

  it('returns all headings for an empty query', () => {
    expect(filterOutline(headings, '   ')).toBe(headings);
  });

  it('calculates a bounded rendering window with overscan', () => {
    const window = getOutlineWindow(2_000, 12_800, 640);

    expect(window.start).toBeGreaterThan(0);
    expect(window.end).toBeLessThan(2_000);
    expect(window.beforeHeight).toBe(window.start * 32);
    expect(window.afterHeight).toBe((2_000 - window.end) * 32);
  });

  it('handles empty outlines safely', () => {
    expect(getOutlineWindow(0, 100, 500)).toEqual({
      start: 0,
      end: 0,
      beforeHeight: 0,
      afterHeight: 0,
    });
  });
});
