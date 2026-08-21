import type { MarkdownCommand } from '../lib/editorCommands';

interface ToolbarProps {
  distractionFree: boolean;
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onExportHtml: () => void;
  onExportPdf: () => void;
  onFind: () => void;
  onCommandPalette: () => void;
  onSettings: () => void;
  onFormat: (command: MarkdownCommand) => void;
  onToggleDistraction: () => void;
}

export function Toolbar({
  distractionFree,
  onNew,
  onOpen,
  onSave,
  onSaveAs,
  onExportHtml,
  onExportPdf,
  onFind,
  onCommandPalette,
  onSettings,
  onFormat,
  onToggleDistraction,
}: ToolbarProps) {
  return (
    <header className="toolbar" aria-label="Application toolbar">
      <div className="brand" aria-label="Markora">
        <img className="brand-logo" src="/markora-logo.svg" alt="" width="28" height="28" />
        <div>
          <strong>Markora</strong>
          <span>Markdown workspace</span>
        </div>
      </div>

      <nav className="toolbar-actions" aria-label="File actions">
        <ToolbarButton label="New" shortcut="Ctrl/⌘ N" onClick={onNew} />
        <ToolbarButton label="Open" shortcut="Ctrl/⌘ O" onClick={onOpen} />
        <ToolbarButton label="Save" shortcut="Ctrl/⌘ S" onClick={onSave} />
        <ToolbarButton label="Save as" shortcut="Ctrl/⌘ Shift S" onClick={onSaveAs} />
        <span className="toolbar-divider" aria-hidden="true" />
        <ToolbarButton label="HTML" shortcut="Export HTML" onClick={onExportHtml} />
        <ToolbarButton label="PDF" shortcut="Print / PDF" onClick={onExportPdf} />
      </nav>

      <nav className="toolbar-actions formatting-actions" aria-label="Formatting actions">
        <ToolbarButton label="H2" shortcut="Toggle heading" onClick={() => onFormat('heading')} />
        <ToolbarButton label="Bold" shortcut="Ctrl/⌘ B" onClick={() => onFormat('bold')} />
        <ToolbarButton label="Italic" shortcut="Ctrl/⌘ I" onClick={() => onFormat('italic')} />
        <ToolbarButton label="Code" shortcut="Inline code" onClick={() => onFormat('inline-code')} />
        <ToolbarButton label="Link" shortcut="Insert link" onClick={() => onFormat('link')} />
        <ToolbarButton label="List" shortcut="Bullet list" onClick={() => onFormat('bullet-list')} />
      </nav>

      <nav className="toolbar-actions toolbar-actions-end" aria-label="Workspace actions">
        <ToolbarButton label="Find" shortcut="Ctrl/⌘ F" onClick={onFind} />
        <ToolbarButton label="Commands" shortcut="Ctrl/⌘ K" onClick={onCommandPalette} />
        <button
          className="toolbar-button"
          type="button"
          aria-pressed={distractionFree}
          title="Distraction-free writing"
          onClick={onToggleDistraction}
        >
          Focus
        </button>
        <ToolbarButton label="Settings" shortcut="Ctrl/⌘ ," onClick={onSettings} />
      </nav>
    </header>
  );
}

interface ToolbarButtonProps {
  label: string;
  shortcut: string;
  onClick: () => void;
}

function ToolbarButton({ label, shortcut, onClick }: ToolbarButtonProps) {
  return (
    <button className="toolbar-button" type="button" onClick={onClick} title={`${label} — ${shortcut}`}>
      {label}
    </button>
  );
}
