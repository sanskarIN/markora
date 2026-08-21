import { isDirty } from '../lib/document';
import type { DocumentTab } from '../types';

interface RecoveryInspectorProps {
  tabs: DocumentTab[];
  activeId: string;
  onActivate: (id: string) => void;
  onCloseTab: (id: string) => void;
  onResetWorkspace: () => void;
}

export function RecoveryInspector({
  tabs,
  activeId,
  onActivate,
  onCloseTab,
  onResetWorkspace,
}: RecoveryInspectorProps) {
  const dirtyCount = tabs.filter(isDirty).length;

  return (
    <div className="recovery-inspector">
      <div className="recovery-summary" role="status">
        <strong>{tabs.length} open {tabs.length === 1 ? 'document' : 'documents'}</strong>
        <span>{dirtyCount ? `${dirtyCount} with unsaved recovery content` : 'All documents match their saved state'}</span>
      </div>

      <div className="recovery-list" aria-label="Recovered workspace documents">
        {tabs.map((tab) => (
          <article className={`recovery-item ${tab.id === activeId ? 'is-active' : ''}`} key={tab.id}>
            <div className="recovery-item-main">
              <strong>{tab.title}</strong>
              <span>{isDirty(tab) ? 'Unsaved recovery content' : 'Saved state'}</span>
              <small>
                {formatBytes(new Blob([tab.content]).size)} · Updated {new Date(tab.updatedAt).toLocaleString()}
              </small>
              <small title={tab.path ?? undefined}>{tab.path ? 'Connected to a disk file' : 'Local recovery only'}</small>
            </div>
            <div className="recovery-actions">
              {tab.id !== activeId ? (
                <button type="button" onClick={() => onActivate(tab.id)}>Open</button>
              ) : (
                <span className="active-recovery-label">Active</span>
              )}
              <button type="button" onClick={() => onCloseTab(tab.id)}>
                Remove
              </button>
            </div>
          </article>
        ))}
      </div>

      <button type="button" className="danger-button" onClick={onResetWorkspace}>
        Reset workspace recovery
      </button>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
