import { useEffect, useMemo, useRef, useState } from 'react';

import { useI18n } from '../i18n';
import { filterOutline, getOutlineWindow, OUTLINE_ROW_HEIGHT } from '../lib/outline';
import type { HeadingItem } from '../types';

interface OutlineNavigatorProps {
  headings: HeadingItem[];
  onHeadingSelect: (heading: HeadingItem) => void;
}

export function OutlineNavigator({ headings, onHeadingSelect }: OutlineNavigatorProps) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(480);
  const listRef = useRef<HTMLDivElement>(null);
  const filtered = useMemo(() => filterOutline(headings, query), [headings, query]);
  const window = useMemo(
    () => getOutlineWindow(filtered.length, scrollTop, viewportHeight),
    [filtered.length, scrollTop, viewportHeight],
  );
  const visible = filtered.slice(window.start, window.end);

  useEffect(() => {
    const element = listRef.current;
    if (!element) return;

    const measure = () => setViewportHeight(Math.max(OUTLINE_ROW_HEIGHT, element.clientHeight));
    measure();

    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const element = listRef.current;
    if (!element) return;
    element.scrollTop = 0;
    setScrollTop(0);
  }, [query]);

  return (
    <div className="outline-navigator">
      <label className="outline-search">
        <span className="sr-only">{t('filterOutline')}</span>
        <input
          type="search"
          value={query}
          maxLength={120}
          placeholder={t('filterHeadings')}
          aria-label={t('filterOutline')}
          onChange={(event) => setQuery(event.target.value)}
        />
        <span aria-live="polite">
          {filtered.length === headings.length ? headings.length : `${filtered.length}/${headings.length}`}
        </span>
      </label>

      {filtered.length ? (
        <div
          ref={listRef}
          className="outline-virtual-list"
          aria-label={t('documentOutlineHeadings')}
          onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
        >
          {window.beforeHeight ? <div aria-hidden="true" style={{ height: window.beforeHeight }} /> : null}
          {visible.map((heading) => (
            <button
              key={`${heading.line}-${heading.id}`}
              className="outline-item"
              type="button"
              style={{
                height: OUTLINE_ROW_HEIGHT,
                paddingInlineStart: `${12 + (heading.level - 1) * 12}px`,
              }}
              title={t('lineNumber', { line: heading.line })}
              onClick={() => onHeadingSelect(heading)}
            >
              <span className="outline-level" aria-hidden="true">H{heading.level}</span>
              <span>{heading.text}</span>
            </button>
          ))}
          {window.afterHeight ? <div aria-hidden="true" style={{ height: window.afterHeight }} /> : null}
        </div>
      ) : (
        <div className="empty-state compact" role="status">
          <strong>{headings.length ? t('noMatchingHeadings') : t('noHeadingsYet')}</strong>
          <p>{headings.length ? t('tryDifferentOutlineFilter') : t('emptyOutline')}</p>
        </div>
      )}
    </div>
  );
}
