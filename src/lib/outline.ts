import type { HeadingItem } from '../types';

export interface OutlineWindow {
  start: number;
  end: number;
  beforeHeight: number;
  afterHeight: number;
}

export const OUTLINE_ROW_HEIGHT = 32;
const OUTLINE_OVERSCAN = 8;

export function filterOutline(headings: HeadingItem[], query: string): HeadingItem[] {
  const needle = query.trim().toLocaleLowerCase().slice(0, 120);
  if (!needle) return headings;

  return headings.filter((heading) =>
    `${heading.text} h${heading.level} ${heading.line}`.toLocaleLowerCase().includes(needle),
  );
}

export function getOutlineWindow(
  itemCount: number,
  scrollTop: number,
  viewportHeight: number,
  rowHeight = OUTLINE_ROW_HEIGHT,
): OutlineWindow {
  if (itemCount <= 0) return { start: 0, end: 0, beforeHeight: 0, afterHeight: 0 };

  const safeScrollTop = Math.max(0, Number.isFinite(scrollTop) ? scrollTop : 0);
  const safeViewport = Math.max(rowHeight, Number.isFinite(viewportHeight) ? viewportHeight : rowHeight);
  const start = Math.max(0, Math.floor(safeScrollTop / rowHeight) - OUTLINE_OVERSCAN);
  const visibleRows = Math.ceil(safeViewport / rowHeight) + OUTLINE_OVERSCAN * 2;
  const end = Math.min(itemCount, start + visibleRows);

  return {
    start,
    end,
    beforeHeight: start * rowHeight,
    afterHeight: Math.max(0, (itemCount - end) * rowHeight),
  };
}
