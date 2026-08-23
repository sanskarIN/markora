import { useI18n } from '../i18n';
import { getWordStats, isDirty } from '../lib/document';
import type { DocumentTab, ToastMessage } from '../types';

interface StatusBarProps {
  tab: DocumentTab;
  autosave: boolean;
  toasts: ToastMessage[];
}

export function StatusBar({ tab, autosave, toasts }: StatusBarProps) {
  const { t } = useI18n();
  const stats = getWordStats(tab.content);

  return (
    <>
      <footer className="status-bar" aria-label={t('documentStatus')}>
        <div className="status-group">
          <span>{t('lineShort', { line: tab.cursorLine })}</span>
          <span>{t('wordCount', { count: stats.words })}</span>
          <span>{t('characterCount', { count: stats.characters })}</span>
        </div>
        <div className="status-group">
          <span>{isDirty(tab) ? t('unsaved') : t('saved')}</span>
          <span>{autosave && tab.path ? t('autosaveOn') : t('recoveryOn')}</span>
          <strong>{t('madeBy')}</strong>
        </div>
      </footer>
      <div className="toast-stack" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <div className={`toast toast-${toast.tone}`} key={toast.id} role="status">
            {toast.message}
          </div>
        ))}
      </div>
    </>
  );
}
