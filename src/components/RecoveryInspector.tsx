import { isDirty } from '../lib/document';
import { getRecoveryDiagnostics } from '../lib/recoveryDiagnostics';
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
  const diagnostics = getRecoveryDiagnostics(tabs);

  return (
    <div className="recovery-inspector">
      <div className="recovery-summary" role="status">
        <strong>{diagnostics.openDocuments} open {diagnostics.openDocuments === 1 ? 'document' : 'documents'}</strong>
        <span>
          {diagnostics.dirtyDocuments
            ? `${diagnostics.dirtyDocuments} with unsaved recovery content`
            : 'All documents match their saved state'}
        </span>
      </div>

      <div className="statistics-grid" aria-label="Recovery diagnostics">
        <Diagnostic label="Disk linked" value={String(diagnostics.diskLinkedDocuments)} />
        <Diagnostic label="Recovery only" value={String(diagnostics.recoveryOnlyDocuments)} />
        <Diagnostic label="Snapshot content" value={formatBytes(diagnostics.totalContentBytes)} />
        <Diagnostic label="Largest document" value={formatBytes(diagnostics.largestDocumentBytes)} />
        <Diagnostic label="Oldest update" value={formatAge(diagnostics.oldestUpdateAgeMs)} />
      </div>
      <p className="settings-note">
        Diagnostics are aggregate counters/sizes only. Markora does not add document text, titles, or paths to diagnostic log fields.
      </p>

      <div className="recovery-list" aria-label="Recovered workspace documents">
        {tabs.map((tab) => (
          <article className={`recovery-item ${tab.id === activeId ? 'is-active' : ''}`} key={tab.id}>
            <div className="recovery-item-main">
              <strong>{tab.title}</strong>
              <span>{isDirty(tab) ? 'Unsaved recovery content' : 'Saved state'}</span>
              <small>
                {formatBytes(new Blob([tab.content]).size)} · Updated {new Date(tab.updatedAt).toLocaleString()}
              </small>
              <small>{tab.path ? 'Connected to a disk file' : 'Local recovery only'}</small>
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

function Diagnostic({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-card">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatAge(milliseconds: number): string {
  if (milliseconds < 60_000) return 'Just now';
  if (milliseconds < 60 * 60_000) return `${Math.floor(milliseconds / 60_000)} min ago`;
  if (milliseconds < 24 * 60 * 60_000) return `${Math.floor(milliseconds / (60 * 60_000))} h ago`;
  return `${Math.floor(milliseconds / (24 * 60 * 60_000))} d ago`;
}
