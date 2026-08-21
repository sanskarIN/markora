import type { DocumentTab, ToastMessage } from '../types';
import { getWordStats, isDirty } from '../lib/document';

interface StatusBarProps {
  tab: DocumentTab;
  autosave: boolean;
  toasts: ToastMessage[];
}

export function StatusBar({ tab, autosave, toasts }: StatusBarProps) {
  const stats = getWordStats(tab.content);

  return (
    <>
      <footer className="status-bar" aria-label="Document status">
        <div className="status-group">
          <span>Ln {tab.cursorLine}</span>
          <span>{stats.words} words</span>
          <span>{stats.characters} characters</span>
        </div>
        <div className="status-group">
          <span>{isDirty(tab) ? 'Unsaved changes' : 'Saved'}</span>
          <span>{autosave && tab.path ? 'Autosave on' : 'Recovery on'}</span>
          <strong>Made by the Sanskar</strong>
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
