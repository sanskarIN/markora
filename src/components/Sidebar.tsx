import { useMemo } from 'react';

import type { HeadingItem, PanelMode, RecentFile } from '../types';
import { getDocumentStatistics } from '../lib/statistics';

interface SidebarProps {
  panel: PanelMode;
  headings: HeadingItem[];
  recentFiles: RecentFile[];
  content?: string;
  onPanelChange: (panel: PanelMode) => void;
  onHeadingSelect: (heading: HeadingItem) => void;
  onRecentOpen: (path: string) => void;
}

export function Sidebar({
  panel,
  headings,
  recentFiles,
  content = '',
  onPanelChange,
  onHeadingSelect,
  onRecentOpen,
}: SidebarProps) {
  const statistics = useMemo(() => getDocumentStatistics(content), [content]);

  return (
    <aside className="sidebar" aria-label="Document navigation">
      <div className="sidebar-tabs" role="tablist" aria-label="Navigation views">
        <button
          className={panel === 'outline' ? 'is-active' : ''}
          type="button"
          role="tab"
          aria-selected={panel === 'outline'}
          onClick={() => onPanelChange('outline')}
        >
          Outline
        </button>
        <button
          className={panel === 'recent' ? 'is-active' : ''}
          type="button"
          role="tab"
          aria-selected={panel === 'recent'}
          onClick={() => onPanelChange('recent')}
        >
          Recent
        </button>
        <button
          className={panel === 'statistics' ? 'is-active' : ''}
          type="button"
          role="tab"
          aria-selected={panel === 'statistics'}
          onClick={() => onPanelChange('statistics')}
        >
          Stats
        </button>
      </div>

      <div className="sidebar-content">
        {panel === 'outline' ? (
          headings.length ? (
            <nav aria-label="Document outline">
              {headings.map((heading) => (
                <button
                  key={`${heading.line}-${heading.id}`}
                  className="outline-item"
                  type="button"
                  style={{ paddingInlineStart: `${12 + (heading.level - 1) * 12}px` }}
                  title={`Line ${heading.line}`}
                  onClick={() => onHeadingSelect(heading)}
                >
                  <span className="outline-level" aria-hidden="true">H{heading.level}</span>
                  <span>{heading.text}</span>
                </button>
              ))}
            </nav>
          ) : (
            <EmptySidebarState title="No headings yet" body="Add Markdown headings to build an outline." />
          )
        ) : panel === 'recent' ? (
          recentFiles.length ? (
            <div className="recent-list">
              {recentFiles.map((file) => (
                <button
                  className="recent-item"
                  key={file.path}
                  type="button"
                  title={file.path}
                  onClick={() => onRecentOpen(file.path)}
                >
                  <strong>{file.name}</strong>
                  <span>{new Date(file.openedAt).toLocaleString()}</span>
                </button>
              ))}
            </div>
          ) : (
            <EmptySidebarState title="No recent files" body="Files opened from disk will appear here." />
          )
        ) : (
          <div className="statistics-grid" aria-label="Document statistics">
            <Statistic label="Words" value={statistics.words} />
            <Statistic label="Characters" value={statistics.characters} />
            <Statistic label="Lines" value={statistics.lines} />
            <Statistic label="Paragraphs" value={statistics.paragraphs} />
            <Statistic label="Headings" value={statistics.headings} />
            <Statistic label="Links" value={statistics.links} />
            <Statistic label="List items" value={statistics.listItems} />
            <Statistic label="Task items" value={statistics.taskItems} />
            <Statistic label="Code blocks" value={statistics.codeBlocks} />
            <Statistic
              label="Reading time"
              value={statistics.readingMinutes ? `${statistics.readingMinutes} min` : '—'}
            />
          </div>
        )}
      </div>
    </aside>
  );
}

function Statistic({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="statistic-card">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function EmptySidebarState({ title, body }: { title: string; body: string }) {
  return (
    <div className="empty-state compact" role="status">
      <strong>{title}</strong>
      <p>{body}</p>
    </div>
  );
}
