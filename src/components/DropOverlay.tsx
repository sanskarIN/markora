import { useI18n } from '../i18n';

interface DropOverlayProps {
  active: boolean;
}

export function DropOverlay({ active }: DropOverlayProps) {
  const { t } = useI18n();
  if (!active) return null;

  return (
    <div className="drop-overlay" role="status" aria-live="polite">
      <div className="drop-overlay-card">
        <span className="drop-overlay-icon" aria-hidden="true">↓</span>
        <strong>{t('dropFiles')}</strong>
        <span>{t('dropFilesHelp')}</span>
      </div>
    </div>
  );
}
