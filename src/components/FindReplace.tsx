import { useEffect, useMemo, useState } from 'react';

import { findMatches, getFindQueryError, replaceAllMatches, replaceMatch } from '../lib/document';
import { clearFindHistory, loadFindHistory, recordFindQuery } from '../lib/findHistory';

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
  const [wholeWord, setWholeWord] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [history, setHistory] = useState<string[]>(loadFindHistory);

  const options = useMemo(
    () => ({ matchCase, wholeWord, useRegex }),
    [matchCase, useRegex, wholeWord],
  );
  const queryError = useMemo(
    () => getFindQueryError(query, options, content.length),
    [content.length, options, query],
  );
  const matches = useMemo(
    () => findMatches(content, query, options),
    [content, options, query],
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

  const rememberQuery = () => {
    if (!query.trim()) return;
    setHistory(recordFindQuery(query));
  };

  const move = (direction: 1 | -1) => {
    if (!matches.length) return;
    rememberQuery();
    setActiveIndex((current) => (current + direction + matches.length) % matches.length);
  };

  const replaceCurrent = () => {
    const match = matches[activeIndex];
    if (!match) return;
    rememberQuery();
    const result = replaceMatch(content, match, replacement);
    onContentChange(result.content);
    window.requestAnimationFrame(() => onSelectRange(result.selectionStart, result.selectionEnd));
  };

  const replaceAll = () => {
    rememberQuery();
    const result = replaceAllMatches(content, query, replacement, options);
    if (result.count) onContentChange(result.content);
  };

  const resetActiveMatch = () => setActiveIndex(0);

  return (
    <section className="find-replace" aria-label="Find and replace">
      <div className="find-row">
        <label>
          <span className="sr-only">Find</span>
          <input
            autoFocus
            type="search"
            list="markora-find-history"
            value={query}
            placeholder={useRegex ? 'Find with regular expression' : 'Find'}
            aria-invalid={queryError ? 'true' : undefined}
            aria-describedby={queryError ? 'find-query-error' : undefined}
            onChange={(event) => {
              setQuery(event.target.value);
              resetActiveMatch();
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                move(event.shiftKey ? -1 : 1);
              }
              if (event.key === 'Escape') onClose();
            }}
          />
          <datalist id="markora-find-history">
            {history.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
        </label>
        <span className="match-count" role="status">
          {queryError ? 'Invalid query' : matches.length ? `${activeIndex + 1} / ${matches.length}` : 'No matches'}
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
              resetActiveMatch();
            }}
          />
          Match case
        </label>
        <label className="inline-check">
          <input
            type="checkbox"
            checked={wholeWord}
            onChange={(event) => {
              setWholeWord(event.target.checked);
              resetActiveMatch();
            }}
          />
          Whole word
        </label>
        <label className="inline-check">
          <input
            type="checkbox"
            checked={useRegex}
            onChange={(event) => {
              setUseRegex(event.target.checked);
              resetActiveMatch();
            }}
          />
          Regex
        </label>
        {history.length ? (
          <button
            type="button"
            className="quiet-button"
            onClick={() => {
              clearFindHistory();
              setHistory([]);
            }}
          >
            Clear history
          </button>
        ) : null}
      </div>
      {queryError ? (
        <p id="find-query-error" className="find-query-error" role="alert">
          {queryError}
        </p>
      ) : null}
    </section>
  );
}
