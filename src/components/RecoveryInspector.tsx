import { useI18n } from '../i18n';
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
  const { t } = useI18n();
  const diagnostics = getRecoveryDiagnostics(tabs);
  const formatAge = (milliseconds: number): string => {
    if (milliseconds < 60_000) return t('justNow');
    if (milliseconds < 60 * 60_000) return t('minutesAgo', { count: Math.floor(milliseconds / 60_000) });
    if (milliseconds < 24 * 60 * 60_000) return t('hoursAgo', { count: Math.floor(milliseconds / (60 * 60_000)) });
    return t('daysAgo', { count: Math.floor(milliseconds / (24 * 60 * 60_000)) });
  };

  return (
    <div className="recovery-inspector">
      <div className="recovery-summary" role="status">
        <strong>
          {diagnostics.openDocuments === 1
            ? t('openDocumentCount', { count: diagnostics.openDocuments })
            : t('openDocumentsCount', { count: diagnostics.openDocuments })}
        </strong>
        <span>
          {diagnostics.dirtyDocuments
            ? t('unsavedRecoveryCount', { count: diagnostics.dirtyDocuments })
            : t('allMatchSaved')}
        </span>
      </div>

      <div className="statistics-grid" aria-label={t('recoveryDiagnostics')}>
        <Diagnostic label={t('diskLinked')} value={String(diagnostics.diskLinkedDocuments)} />
        <Diagnostic label={t('recoveryOnly')} value={String(diagnostics.recoveryOnlyDocuments)} />
        <Diagnostic label={t('snapshotContent')} value={formatBytes(diagnostics.totalContentBytes)} />
        <Diagnostic label={t('largestDocument')} value={formatBytes(diagnostics.largestDocumentBytes)} />
        <Diagnostic label={t('oldestUpdate')} value={formatAge(diagnostics.oldestUpdateAgeMs)} />
      </div>
      <p className="settings-note">{t('safeDiagnosticsNote')}</p>

      <div className="recovery-list" aria-label={t('recoveredWorkspaceDocuments')}>
        {tabs.map((tab) => (
          <article className={`recovery-item ${tab.id === activeId ? 'is-active' : ''}`} key={tab.id}>
            <div className="recovery-item-main">
              <strong>{tab.title}</strong>
              <span>{isDirty(tab) ? t('unsavedRecoveryContent') : t('savedState')}</span>
              <small>
                {t('updatedAt', {
                  size: formatBytes(new Blob([tab.content]).size),
                  date: new Date(tab.updatedAt).toLocaleString(),
                })}
              </small>
              <small>{tab.path ? t('connectedDiskFile') : t('localRecoveryOnly')}</small>
            </div>
            <div className="recovery-actions">
              {tab.id !== activeId ? (
                <button type="button" onClick={() => onActivate(tab.id)}>{t('openFile')}</button>
              ) : (
                <span className="active-recovery-label">{t('active')}</span>
              )}
              <button type="button" onClick={() => onCloseTab(tab.id)}>
                {t('remove')}
              </button>
            </div>
          </article>
        ))}
      </div>

      <button type="button" className="danger-button" onClick={onResetWorkspace}>
        {t('resetWorkspaceRecovery')}
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
