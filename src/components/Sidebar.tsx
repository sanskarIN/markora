import type { HeadingItem, PanelMode, RecentFile } from '../types';

interface SidebarProps {
  panel: PanelMode;
  headings: HeadingItem[];
  recentFiles: RecentFile[];
  onPanelChange: (panel: PanelMode) => void;
  onHeadingSelect: (heading: HeadingItem) => void;
  onRecentOpen: (path: string) => void;
}

export function Sidebar({
  panel,
  headings,
  recentFiles,
  onPanelChange,
  onHeadingSelect,
  onRecentOpen,
}: SidebarProps) {
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
        ) : recentFiles.length ? (
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
        )}
      </div>
    </aside>
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
