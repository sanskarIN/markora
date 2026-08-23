import { useI18n } from '../i18n';
import { isDirty } from '../lib/document';
import type { DocumentTab } from '../types';

interface TabBarProps {
  tabs: DocumentTab[];
  activeId: string;
  onActivate: (id: string) => void;
  onClose: (id: string) => void;
  onNew: () => void;
}

export function TabBar({ tabs, activeId, onActivate, onClose, onNew }: TabBarProps) {
  const { t } = useI18n();

  return (
    <div className="tab-bar" role="tablist" aria-label={t('openDocuments')}>
      <div className="tab-strip">
        {tabs.map((tab) => {
          const active = tab.id === activeId;
          return (
            <div className={`tab ${active ? 'is-active' : ''}`} key={tab.id}>
              <button
                className="tab-main"
                type="button"
                role="tab"
                aria-selected={active}
                title={tab.path ?? tab.title}
                onClick={() => onActivate(tab.id)}
              >
                <span className="tab-title">{tab.title}</span>
                {isDirty(tab) ? <span className="dirty-dot" aria-label={t('unsaved')}>●</span> : null}
              </button>
              <button
                className="tab-close"
                type="button"
                aria-label={t('closeDocument', { title: tab.title })}
                onClick={() => onClose(tab.id)}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
      <button className="tab-new" type="button" onClick={onNew} aria-label={t('newDocument')} title={t('newDocument')}>
        +
      </button>
    </div>
  );
}
