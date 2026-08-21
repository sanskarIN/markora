import { useEffect, useMemo, useState } from 'react';

import { findMatches, replaceAllMatches, replaceMatch } from '../lib/document';

interface FindReplaceProps {
  open: boolean;
  content: string;
  onClose: () => void;
  onContentChange: (content: string) => void;
  onSelectRange: (start: number, end: number) => void;
}

export function FindReplace({
  open,
  content,
  onClose,
  onContentChange,
  onSelectRange,
}: FindReplaceProps) {
  const [query, setQuery] = useState('');
  const [replacement, setReplacement] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const matches = useMemo(
    () => findMatches(content, query, { matchCase }),
    [content, matchCase, query],
  );

  useEffect(() => {
    setActiveIndex((current) => (matches.length ? Math.min(current, matches.length - 1) : 0));
  }, [matches.length]);

  useEffect(() => {
    if (!open || !matches.length) return;
    const match = matches[activeIndex];
    if (match) onSelectRange(match.start, match.end);
  }, [activeIndex, matches, onSelectRange, open]);

  if (!open) return null;

  const move = (direction: 1 | -1) => {
    if (!matches.length) return;
    setActiveIndex((current) => (current + direction + matches.length) % matches.length);
  };

  const replaceCurrent = () => {
    const match = matches[activeIndex];
    if (!match) return;
    const result = replaceMatch(content, match, replacement);
    onContentChange(result.content);
    window.requestAnimationFrame(() => onSelectRange(result.selectionStart, result.selectionEnd));
  };

  const replaceAll = () => {
    const result = replaceAllMatches(content, query, replacement, { matchCase });
    if (result.count) onContentChange(result.content);
  };

  return (
    <section className="find-replace" aria-label="Find and replace">
      <div className="find-row">
        <label>
          <span className="sr-only">Find</span>
          <input
            autoFocus
            type="search"
            value={query}
            placeholder="Find"
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                move(event.shiftKey ? -1 : 1);
              }
              if (event.key === 'Escape') onClose();
            }}
          />
        </label>
        <span className="match-count" role="status">
          {matches.length ? `${activeIndex + 1} / ${matches.length}` : 'No matches'}
        </span>
        <button type="button" onClick={() => move(-1)} disabled={!matches.length} aria-label="Previous match">
          ↑
        </button>
        <button type="button" onClick={() => move(1)} disabled={!matches.length} aria-label="Next match">
          ↓
        </button>
        <button type="button" onClick={onClose} aria-label="Close find and replace">
          ×
        </button>
      </div>
      <div className="find-row">
        <label>
          <span className="sr-only">Replace with</span>
          <input
            type="text"
            value={replacement}
            placeholder="Replace with"
            onChange={(event) => setReplacement(event.target.value)}
          />
        </label>
        <button type="button" onClick={replaceCurrent} disabled={!matches.length}>
          Replace
        </button>
        <button type="button" onClick={replaceAll} disabled={!matches.length}>
          Replace all
        </button>
        <label className="inline-check">
          <input
            type="checkbox"
            checked={matchCase}
            onChange={(event) => {
              setMatchCase(event.target.checked);
              setActiveIndex(0);
            }}
          />
          Match case
        </label>
      </div>
    </section>
  );
}
