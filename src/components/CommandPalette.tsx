import { useEffect, useMemo, useState } from 'react';

import { useI18n } from '../i18n';
import type { CommandAction } from '../types';

interface CommandPaletteProps {
  open: boolean;
  actions: CommandAction[];
  onClose: () => void;
}

export function CommandPalette({ open, actions, onClose }: CommandPaletteProps) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return actions;
    return actions.filter((action) =>
      [action.label, ...action.keywords].some((value) => value.toLocaleLowerCase().includes(needle)),
    );
  }, [actions, query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex((current) => (filtered.length ? Math.min(current, filtered.length - 1) : 0));
  }, [filtered.length]);

  if (!open) return null;

  const run = (action: CommandAction | undefined) => {
    if (!action) return;
    onClose();
    void action.run();
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="command-palette"
        role="dialog"
        aria-modal="true"
        aria-label={t('commandPalette')}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <input
          autoFocus
          className="command-search"
          type="search"
          placeholder={t('typeCommand')}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') onClose();
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              if (filtered.length) setActiveIndex((index) => (index + 1) % filtered.length);
            }
            if (event.key === 'ArrowUp') {
              event.preventDefault();
              if (filtered.length) setActiveIndex((index) => (index - 1 + filtered.length) % filtered.length);
            }
            if (event.key === 'Enter') {
              event.preventDefault();
              run(filtered[activeIndex]);
            }
          }}
        />

        <div className="command-list" role="listbox" aria-label={t('availableCommands')}>
          {filtered.length ? (
            filtered.map((action, index) => (
              <button
                className={`command-item ${index === activeIndex ? 'is-active' : ''}`}
                key={action.id}
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => run(action)}
              >
                <span>{action.label}</span>
                {action.shortcut ? <kbd>{action.shortcut}</kbd> : null}
              </button>
            ))
          ) : (
            <div className="empty-state compact">
              <strong>{t('noMatchingCommands')}</strong>
              <p>{t('tryDifferentWord')}</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
