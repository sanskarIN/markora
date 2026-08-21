import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';

import { CommandPalette } from './components/CommandPalette';
import { EditorPane } from './components/EditorPane';
import { FindReplace } from './components/FindReplace';
import { Onboarding } from './components/Onboarding';
import { PreviewPane } from './components/PreviewPane';
import { SettingsPanel } from './components/SettingsPanel';
import { Sidebar } from './components/Sidebar';
import { StatusBar } from './components/StatusBar';
import { TabBar } from './components/TabBar';
import { Toolbar } from './components/Toolbar';
import { useLayoutPreferences } from './hooks/useLayoutPreferences';
import { useWorkspace } from './hooks/useWorkspace';
import { getBreadcrumb, getCursorLine, getHeadings, isDirty } from './lib/document';
import { applyMarkdownCommand, type MarkdownCommand } from './lib/editorCommands';
import { openExternalUrl } from './lib/platform';
import type { CommandAction, HeadingItem, PanelMode } from './types';

export default function App() {
  const workspace = useWorkspace();
  const {
    state,
    activeTab,
    toasts,
    recoveredWorkspace,
    setActiveId,
    newTab,
    updateActiveContent,
    updateCursorLine,
    closeTab,
    openFile,
    openRecent,
    saveActive,
    exportHtml,
    exportBackup,
    restoreBackup,
    updateSettings,
    completeOnboarding,
    notify,
  } = workspace;
  const { layout, setMode, setEditorPanePercent, resetLayout } = useLayoutPreferences();

  const [panel, setPanel] = useState<PanelMode>('outline');
  const [findOpen, setFindOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [distractionFree, setDistractionFree] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const recoveryNoticeShown = useRef(false);

  const headings = useMemo(() => getHeadings(activeTab?.content ?? ''), [activeTab?.content]);
  const breadcrumbs = useMemo(
    () => getBreadcrumb(headings, activeTab?.cursorLine ?? 1),
    [activeTab?.cursorLine, headings],
  );

  const applyEditorCommand = useCallback(
    (command: MarkdownCommand) => {
      const editor = editorRef.current;
      if (!activeTab) return;
      if (!editor) {
        setMode('editor');
        notify('info', 'Switched to Editor layout. Run the formatting command again.');
        return;
      }

      const result = applyMarkdownCommand(
        activeTab.content,
        editor.selectionStart,
        editor.selectionEnd,
        command,
      );
      updateActiveContent(result.content);
      window.requestAnimationFrame(() => {
        editor.focus();
        editor.setSelectionRange(result.selectionStart, result.selectionEnd);
        updateCursorLine(getCursorLine(result.content, result.selectionStart));
      });
    },
    [activeTab, notify, setMode, updateActiveContent, updateCursorLine],
  );

  useEffect(() => {
    if (!recoveredWorkspace || recoveryNoticeShown.current) return;
    recoveryNoticeShown.current = true;
    notify('info', 'Recovered your previous workspace.');
  }, [notify, recoveredWorkspace]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => {
      const resolved = state.settings.themeMode === 'system' ? (media.matches ? 'dark' : 'light') : state.settings.themeMode;
      document.documentElement.dataset.theme = resolved;
      document.documentElement.dataset.editorTheme = state.settings.editorTheme;
      document.documentElement.dataset.reducedMotion = state.settings.reducedMotion ? 'true' : 'false';
    };
    applyTheme();
    media.addEventListener('change', applyTheme);
    return () => media.removeEventListener('change', applyTheme);
  }, [state.settings.editorTheme, state.settings.reducedMotion, state.settings.themeMode]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!state.tabs.some(isDirty)) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state.tabs]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const modifier = event.ctrlKey || event.metaKey;
      if (!modifier) {
        if (event.key === 'Escape') {
          setCommandOpen(false);
          setSettingsOpen(false);
          setFindOpen(false);
        }
        return;
      }

      const key = event.key.toLocaleLowerCase();
      if (key === 'n') {
        event.preventDefault();
        newTab();
      } else if (key === 'o') {
        event.preventDefault();
        void openFile();
      } else if (key === 's') {
        event.preventDefault();
        void saveActive(event.shiftKey);
      } else if (key === 'f') {
        event.preventDefault();
        setFindOpen(true);
      } else if (key === 'k' || (event.shiftKey && key === 'p')) {
        event.preventDefault();
        setCommandOpen(true);
      } else if (key === ',') {
        event.preventDefault();
        setSettingsOpen(true);
      } else if (key === 'b') {
        event.preventDefault();
        applyEditorCommand('bold');
      } else if (key === 'i') {
        event.preventDefault();
        applyEditorCommand('italic');
      }
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [applyEditorCommand, newTab, openFile, saveActive]);

  const handleOpenLink = async (url: string) => {
    const opened = await openExternalUrl(url);
    if (!opened) notify('warning', 'That link was blocked for safety.');
  };

  const handleHeadingSelect = (heading: HeadingItem) => {
    document.getElementById(heading.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (!activeTab || !editorRef.current) return;

    const lines = activeTab.content.split('\n');
    const offset = lines.slice(0, heading.line - 1).reduce((total, line) => total + line.length + 1, 0);
    editorRef.current.focus();
    editorRef.current.setSelectionRange(offset, offset);
    editorRef.current.scrollTop = Math.max(
      0,
      (heading.line - 2) * state.settings.fontSize * state.settings.lineHeight,
    );
    updateCursorLine(heading.line);
  };

  const selectEditorRange = (start: number, end: number) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    editor.setSelectionRange(start, end);
  };

  const exportPdf = () => {
    document.documentElement.classList.add('print-preview-mode');
    window.requestAnimationFrame(() => {
      window.print();
      window.setTimeout(() => document.documentElement.classList.remove('print-preview-mode'), 250);
    });
  };

  const commands = useMemo<CommandAction[]>(
    () => [
      { id: 'new', label: 'New document', shortcut: 'Ctrl/⌘ N', keywords: ['file', 'tab'], run: newTab },
      { id: 'open', label: 'Open Markdown file', shortcut: 'Ctrl/⌘ O', keywords: ['file', 'disk'], run: () => void openFile() },
      { id: 'save', label: 'Save document', shortcut: 'Ctrl/⌘ S', keywords: ['file', 'disk'], run: () => void saveActive(false) },
      { id: 'save-as', label: 'Save document as…', shortcut: 'Ctrl/⌘ Shift S', keywords: ['file', 'copy'], run: () => void saveActive(true) },
      { id: 'find', label: 'Find and replace', shortcut: 'Ctrl/⌘ F', keywords: ['search', 'replace'], run: () => setFindOpen(true) },
      { id: 'format-bold', label: 'Format selection as bold', shortcut: 'Ctrl/⌘ B', keywords: ['format', 'strong'], run: () => applyEditorCommand('bold') },
      { id: 'format-italic', label: 'Format selection as italic', shortcut: 'Ctrl/⌘ I', keywords: ['format', 'emphasis'], run: () => applyEditorCommand('italic') },
      { id: 'format-inline-code', label: 'Format selection as inline code', shortcut: null, keywords: ['format', 'code'], run: () => applyEditorCommand('inline-code') },
      { id: 'format-heading', label: 'Toggle level 2 heading', shortcut: null, keywords: ['format', 'heading'], run: () => applyEditorCommand('heading') },
      { id: 'format-quote', label: 'Toggle block quote', shortcut: null, keywords: ['format', 'quote'], run: () => applyEditorCommand('quote') },
      { id: 'format-bullets', label: 'Toggle bullet list', shortcut: null, keywords: ['format', 'list'], run: () => applyEditorCommand('bullet-list') },
      { id: 'format-numbered', label: 'Toggle numbered list', shortcut: null, keywords: ['format', 'list'], run: () => applyEditorCommand('ordered-list') },
      { id: 'format-task', label: 'Toggle task list', shortcut: null, keywords: ['format', 'todo', 'checkbox'], run: () => applyEditorCommand('task-list') },
      { id: 'format-code-block', label: 'Toggle fenced code block', shortcut: null, keywords: ['format', 'code', 'fence'], run: () => applyEditorCommand('code-block') },
      { id: 'format-link', label: 'Insert Markdown link', shortcut: null, keywords: ['format', 'link', 'url'], run: () => applyEditorCommand('link') },
      { id: 'layout-split', label: 'Use split editor and preview layout', shortcut: null, keywords: ['layout', 'preview'], run: () => setMode('split') },
      { id: 'layout-editor', label: 'Use editor-only layout', shortcut: null, keywords: ['layout', 'focus'], run: () => setMode('editor') },
      { id: 'layout-preview', label: 'Use preview-only layout', shortcut: null, keywords: ['layout', 'reader'], run: () => setMode('preview') },
      { id: 'html', label: 'Export HTML', shortcut: null, keywords: ['export', 'web'], run: () => void exportHtml() },
      { id: 'pdf', label: 'Print / export PDF', shortcut: null, keywords: ['export', 'print'], run: exportPdf },
      { id: 'settings', label: 'Open settings', shortcut: 'Ctrl/⌘ ,', keywords: ['preferences', 'theme'], run: () => setSettingsOpen(true) },
      { id: 'focus', label: distractionFree ? 'Exit distraction-free mode' : 'Enter distraction-free mode', shortcut: null, keywords: ['focus', 'writing'], run: () => setDistractionFree((value) => !value) },
    ],
    [applyEditorCommand, distractionFree, exportHtml, newTab, openFile, saveActive, setMode],
  );

  if (!activeTab) return null;

  const showSidebar = state.settings.showOutline && !distractionFree;
  const showEditor = distractionFree || layout.mode !== 'preview';
  const showPreview =
    !distractionFree &&
    (layout.mode === 'preview' || (layout.mode === 'split' && state.settings.showPreview));
  const layoutClass = [
    'workspace-grid',
    showSidebar ? 'has-sidebar' : 'no-sidebar',
    showPreview ? 'has-preview' : 'no-preview',
    `layout-${distractionFree ? 'editor' : layout.mode}`,
  ].join(' ');
  const layoutStyle = {
    '--editor-ratio': `${layout.editorPanePercent}fr`,
    '--preview-ratio': `${100 - layout.editorPanePercent}fr`,
  } as CSSProperties;

  return (
    <div className={`app-shell ${distractionFree ? 'is-distraction-free' : ''}`}>
      {!distractionFree ? (
        <Toolbar
          distractionFree={distractionFree}
          layoutMode={layout.mode}
          onNew={newTab}
          onOpen={() => void openFile()}
          onSave={() => void saveActive(false)}
          onSaveAs={() => void saveActive(true)}
          onExportHtml={() => void exportHtml()}
          onExportPdf={exportPdf}
          onFind={() => setFindOpen(true)}
          onCommandPalette={() => setCommandOpen(true)}
          onSettings={() => setSettingsOpen(true)}
          onFormat={applyEditorCommand}
          onLayoutModeChange={setMode}
          onToggleDistraction={() => setDistractionFree((value) => !value)}
        />
      ) : (
        <button
          className="focus-exit"
          type="button"
          onClick={() => setDistractionFree(false)}
          title="Exit distraction-free mode"
        >
          Exit focus
        </button>
      )}

      {!distractionFree ? (
        <TabBar
          tabs={state.tabs}
          activeId={state.activeId}
          onActivate={setActiveId}
          onClose={closeTab}
          onNew={newTab}
        />
      ) : null}

      <FindReplace
        open={findOpen}
        content={activeTab.content}
        onClose={() => setFindOpen(false)}
        onContentChange={updateActiveContent}
        onSelectRange={selectEditorRange}
      />

      <main className={layoutClass} style={layoutStyle}>
        {showSidebar ? (
          <Sidebar
            panel={panel}
            headings={headings}
            recentFiles={state.recentFiles}
            content={activeTab.content}
            onPanelChange={setPanel}
            onHeadingSelect={handleHeadingSelect}
            onRecentOpen={(path) => void openRecent(path)}
          />
        ) : null}

        {showEditor ? (
          <EditorPane
            ref={editorRef}
            title={activeTab.title}
            content={activeTab.content}
            breadcrumbs={breadcrumbs}
            fontSize={state.settings.fontSize}
            lineHeight={state.settings.lineHeight}
            wordWrap={state.settings.wordWrap}
            onChange={updateActiveContent}
            onCursorLineChange={updateCursorLine}
          />
        ) : null}

        {showPreview ? <PreviewPane markdown={activeTab.content} onOpenLink={handleOpenLink} /> : null}
      </main>

      <StatusBar tab={activeTab} autosave={state.settings.autosave} toasts={toasts} />

      <CommandPalette open={commandOpen} actions={commands} onClose={() => setCommandOpen(false)} />
      <SettingsPanel
        open={settingsOpen}
        settings={state.settings}
        layoutMode={layout.mode}
        editorPanePercent={layout.editorPanePercent}
        onUpdate={updateSettings}
        onLayoutModeChange={setMode}
        onEditorPanePercentChange={setEditorPanePercent}
        onResetLayout={resetLayout}
        onExportBackup={() => void exportBackup()}
        onRestoreBackup={() => void restoreBackup()}
        onOpenLink={handleOpenLink}
        onClose={() => setSettingsOpen(false)}
      />
      <Onboarding open={!state.onboardingComplete} onComplete={completeOnboarding} />
    </div>
  );
}
