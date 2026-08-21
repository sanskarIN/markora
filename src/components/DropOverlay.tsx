interface DropOverlayProps {
  active: boolean;
}

export function DropOverlay({ active }: DropOverlayProps) {
  if (!active) return null;

  return (
    <div className="drop-overlay" role="status" aria-live="polite">
      <div className="drop-overlay-card">
        <span className="drop-overlay-icon" aria-hidden="true">↓</span>
        <strong>Drop Markdown files to open</strong>
        <span>Up to 20 UTF-8 .md, .markdown, .mdown, .mkdn, or .txt files · 16 MB each</span>
      </div>
    </div>
  );
}
