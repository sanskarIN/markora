import { useMemo } from 'react';

import { useI18n } from '../i18n';
import { getDocumentStatistics } from '../lib/statistics';
import type { HeadingItem, PanelMode, RecentFile } from '../types';
import { OutlineNavigator } from './OutlineNavigator';

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
  const { t } = useI18n();
  const statistics = useMemo(() => getDocumentStatistics(content), [content]);

  return (
    <aside className="sidebar" aria-label={t('documentNavigation')}>
      <div className="sidebar-tabs" role="tablist" aria-label={t('navigationViews')}>
        <button
          className={panel === 'outline' ? 'is-active' : ''}
          type="button"
          role="tab"
          aria-selected={panel === 'outline'}
          onClick={() => onPanelChange('outline')}
        >
          {t('outline')}
        </button>
        <button
          className={panel === 'recent' ? 'is-active' : ''}
          type="button"
          role="tab"
          aria-selected={panel === 'recent'}
          onClick={() => onPanelChange('recent')}
        >
          {t('recent')}
        </button>
        <button
          className={panel === 'statistics' ? 'is-active' : ''}
          type="button"
          role="tab"
          aria-selected={panel === 'statistics'}
          onClick={() => onPanelChange('statistics')}
        >
          {t('stats')}
        </button>
      </div>

      <div className={`sidebar-content sidebar-content-${panel}`}>
        {panel === 'outline' ? (
          <OutlineNavigator headings={headings} onHeadingSelect={onHeadingSelect} />
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
            <EmptySidebarState title={t('noRecentFiles')} body={t('emptyRecent')} />
          )
        ) : (
          <div className="statistics-grid" aria-label={t('documentStatistics')}>
            <Statistic label={t('words')} value={statistics.words} />
            <Statistic label={t('characters')} value={statistics.characters} />
            <Statistic label={t('lines')} value={statistics.lines} />
            <Statistic label={t('paragraphs')} value={statistics.paragraphs} />
            <Statistic label={t('headings')} value={statistics.headings} />
            <Statistic label={t('links')} value={statistics.links} />
            <Statistic label={t('listItems')} value={statistics.listItems} />
            <Statistic label={t('taskItems')} value={statistics.taskItems} />
            <Statistic label={t('codeBlocks')} value={statistics.codeBlocks} />
            <Statistic
              label={t('readingTime')}
              value={statistics.readingMinutes ? t('minutesShort', { count: statistics.readingMinutes }) : '—'}
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
