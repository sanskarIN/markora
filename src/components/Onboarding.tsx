import { useI18n } from '../i18n';

interface OnboardingProps {
  open: boolean;
  onComplete: () => void;
}

export function Onboarding({ open, onComplete }: OnboardingProps) {
  const { t } = useI18n();
  if (!open) return null;

  return (
    <div className="modal-backdrop onboarding-backdrop">
      <section className="onboarding-card" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
        <img src="/markora-logo.svg" alt={t('markoraLogo')} width="76" height="76" />
        <span className="eyebrow">{t('welcomeToMarkora')}</span>
        <h1 id="onboarding-title">{t('onboardingTitle')}</h1>
        <p>{t('onboardingBody')}</p>
        <div className="onboarding-grid">
          <Feature title={t('localFirst')} text={t('localFirstBody')} />
          <Feature title={t('safePreview')} text={t('safePreviewBody')} />
          <Feature title={t('fastWorkflow')} text={t('fastWorkflowBody')} />
        </div>
        <button className="primary-button" type="button" onClick={onComplete}>
          {t('startWriting')}
        </button>
        <small>{t('madeByLicensed')}</small>
      </section>
    </div>
  );
}

function Feature({ title, text }: { title: string; text: string }) {
  return (
    <div className="onboarding-feature">
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  );
}
