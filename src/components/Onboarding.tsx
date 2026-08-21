interface OnboardingProps {
  open: boolean;
  onComplete: () => void;
}

export function Onboarding({ open, onComplete }: OnboardingProps) {
  if (!open) return null;

  return (
    <div className="modal-backdrop onboarding-backdrop">
      <section className="onboarding-card" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
        <img src="/markora-logo.svg" alt="Markora logo" width="76" height="76" />
        <span className="eyebrow">Welcome to Markora</span>
        <h1 id="onboarding-title">Write clearly. Keep it local.</h1>
        <p>
          Edit Markdown with a live sanitized preview, automatic recovery, multiple tabs, keyboard commands,
          and native desktop files—without an account.
        </p>
        <div className="onboarding-grid">
          <Feature title="Local-first" text="Your documents stay on your device unless you choose to move them." />
          <Feature title="Safe preview" text="Raw HTML, unsafe URL schemes, and remote image loading are blocked by default." />
          <Feature title="Fast workflow" text="Use Ctrl/Cmd + K for commands and Ctrl/Cmd + F for find and replace." />
        </div>
        <button className="primary-button" type="button" onClick={onComplete}>
          Start writing
        </button>
        <small>Made by the Sanskar · MIT licensed</small>
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
