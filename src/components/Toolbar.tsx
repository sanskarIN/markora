import { useI18n } from '../i18n';
import type { MarkdownCommand } from '../lib/editorCommands';
import type { LayoutMode } from '../lib/layout';

interface ToolbarProps {
  distractionFree: boolean;
  layoutMode: LayoutMode;
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
  onLayoutModeChange: (mode: LayoutMode) => void;
  onToggleDistraction: () => void;
}

export function Toolbar({
  distractionFree,
  layoutMode,
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
  onLayoutModeChange,
  onToggleDistraction,
}: ToolbarProps) {
  const { t } = useI18n();

  return (
    <header className="toolbar" aria-label={t('applicationToolbar')}>
      <div className="brand" aria-label={t('appName')}>
        <img className="brand-logo" src="/markora-logo.svg" alt="" width="28" height="28" />
        <div>
          <strong>{t('appName')}</strong>
          <span>{t('markdownWorkspace')}</span>
        </div>
      </div>

      <nav className="toolbar-actions" aria-label={t('fileActions')}>
        <ToolbarButton label={t('newFile')} shortcut="Ctrl/⌘ N" onClick={onNew} />
        <ToolbarButton label={t('openFile')} shortcut="Ctrl/⌘ O" onClick={onOpen} />
        <ToolbarButton label={t('save')} shortcut="Ctrl/⌘ S" onClick={onSave} />
        <ToolbarButton label={t('saveAs')} shortcut="Ctrl/⌘ Shift S" onClick={onSaveAs} />
        <span className="toolbar-divider" aria-hidden="true" />
        <ToolbarButton label={t('html')} shortcut={t('exportHtml')} onClick={onExportHtml} />
        <ToolbarButton label={t('pdf')} shortcut={t('exportPdf')} onClick={onExportPdf} />
      </nav>

      <nav className="toolbar-actions formatting-actions" aria-label={t('formattingActions')}>
        <ToolbarButton label={t('h2')} shortcut={t('toggleHeading')} onClick={() => onFormat('heading')} />
        <ToolbarButton label={t('bold')} shortcut="Ctrl/⌘ B" onClick={() => onFormat('bold')} />
        <ToolbarButton label={t('italic')} shortcut="Ctrl/⌘ I" onClick={() => onFormat('italic')} />
        <ToolbarButton label={t('code')} shortcut={t('inlineCode')} onClick={() => onFormat('inline-code')} />
        <ToolbarButton label={t('link')} shortcut={t('insertLink')} onClick={() => onFormat('link')} />
        <ToolbarButton label={t('list')} shortcut={t('bulletList')} onClick={() => onFormat('bullet-list')} />
      </nav>

      <nav className="toolbar-actions layout-actions" aria-label={t('editorLayout')}>
        <LayoutButton label={t('split')} mode="split" active={layoutMode === 'split'} onChange={onLayoutModeChange} />
        <LayoutButton label={t('editor')} mode="editor" active={layoutMode === 'editor'} onChange={onLayoutModeChange} />
        <LayoutButton label={t('preview')} mode="preview" active={layoutMode === 'preview'} onChange={onLayoutModeChange} />
      </nav>

      <nav className="toolbar-actions toolbar-actions-end" aria-label={t('workspaceActions')}>
        <ToolbarButton label={t('find')} shortcut="Ctrl/⌘ F" onClick={onFind} />
        <ToolbarButton label={t('commands')} shortcut="Ctrl/⌘ K" onClick={onCommandPalette} />
        <button
          className="toolbar-button"
          type="button"
          aria-pressed={distractionFree}
          title={t('distractionFreeWriting')}
          onClick={onToggleDistraction}
        >
          {t('focus')}
        </button>
        <ToolbarButton label={t('settings')} shortcut="Ctrl/⌘ ," onClick={onSettings} />
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

function LayoutButton({
  label,
  mode,
  active,
  onChange,
}: {
  label: string;
  mode: LayoutMode;
  active: boolean;
  onChange: (mode: LayoutMode) => void;
}) {
  const { t } = useI18n();
  return (
    <button
      className="toolbar-button"
      type="button"
      aria-pressed={active}
      onClick={() => onChange(mode)}
      title={t('layoutLabel', { layout: label })}
    >
      {label}
    </button>
  );
}
