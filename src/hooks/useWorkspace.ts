import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  DEFAULT_SETTINGS,
  type DocumentTab,
  type EditorSettings,
  type RecentFile,
  type ToastMessage,
  type WorkspaceSnapshot,
} from '../types';
import { createDocument, createId, deriveFileName, isDirty, WELCOME_MARKDOWN } from '../lib/document';
import { logger } from '../lib/logging';
import { renderMarkdownDocument } from '../lib/markdown';
import {
  exportHtmlFile,
  getFileFingerprint,
  isDesktopRuntime,
  openBackupFile,
  openMarkdownFile,
  readMarkdownFile,
  saveBackupFile,
  saveMarkdownFile,
} from '../lib/platform';
import {
  clearWorkspace,
  exportBackupPayload,
  importBackupPayload,
  loadOnboardingComplete,
  loadWorkspace,
  saveOnboardingComplete,
  saveWorkspace,
} from '../lib/storage';

interface WorkspaceState {
  tabs: DocumentTab[];
  activeId: string;
  recentFiles: RecentFile[];
  settings: EditorSettings;
  onboardingComplete: boolean;
}

function initialWorkspace(): WorkspaceState {
  const recovered = loadWorkspace();
  if (recovered) {
    return {
      tabs: recovered.tabs,
      activeId: recovered.activeId,
      recentFiles: recovered.recentFiles,
      settings: recovered.settings,
      onboardingComplete: recovered.onboardingComplete || loadOnboardingComplete(),
    };
  }

  const tab = createDocument(WELCOME_MARKDOWN, 'Welcome.md');
  return {
    tabs: [tab],
    activeId: tab.id,
    recentFiles: [],
    settings: DEFAULT_SETTINGS,
    onboardingComplete: loadOnboardingComplete(),
  };
}

export function useWorkspace() {
  const [state, setState] = useState<WorkspaceState>(initialWorkspace);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const initialRecoveryRef = useRef(loadWorkspace() !== null);
  const autosaveGenerationRef = useRef(0);
  const diskFingerprintsRef = useRef(new Map<string, string>());
  const conflictWarningsRef = useRef(new Set<string>());
  const unverifiedRecoveredPathsRef = useRef(
    new Set(
      initialRecoveryRef.current
        ? state.tabs.flatMap((tab) => (tab.path && isDirty(tab) ? [tab.path] : []))
        : [],
    ),
  );

  const activeTab = useMemo(
    () => state.tabs.find((tab) => tab.id === state.activeId) ?? state.tabs[0],
    [state.activeId, state.tabs],
  );

  const snapshot = useMemo<WorkspaceSnapshot>(
    () => ({
      version: 1,
      activeId: state.activeId,
      tabs: state.tabs,
      recentFiles: state.recentFiles,
      settings: state.settings,
      onboardingComplete: state.onboardingComplete,
      savedAt: Date.now(),
    }),
    [state],
  );

  const notify = useCallback((tone: ToastMessage['tone'], message: string) => {
    const id = createId();
    setToasts((current) => [...current.slice(-3), { id, tone, message }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4200);
  }, []);

  const rememberFingerprint = useCallback(async (path: string | null) => {
    if (!path || !isDesktopRuntime()) return;
    try {
      const fingerprint = await getFileFingerprint(path);
      if (!fingerprint) return;
      diskFingerprintsRef.current.set(path, fingerprint);
      conflictWarningsRef.current.delete(path);
      unverifiedRecoveredPathsRef.current.delete(path);
    } catch (error: unknown) {
      logger.warn('file_fingerprint_failed', { message: errorMessage(error), path });
    }
  }, []);

  const hasExternalChange = useCallback(async (path: string): Promise<boolean> => {
    if (!isDesktopRuntime()) return false;
    const currentFingerprint = await getFileFingerprint(path);
    if (!currentFingerprint) return false;

    const rememberedFingerprint = diskFingerprintsRef.current.get(path);
    if (!rememberedFingerprint) {
      diskFingerprintsRef.current.set(path, currentFingerprint);
      return false;
    }

    return currentFingerprint !== rememberedFingerprint;
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const result = saveWorkspace(snapshot);
      if (!result.ok) logger.warn('workspace_recovery_failed', { reason: result.reason });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [snapshot]);

  useEffect(() => {
    if (!state.settings.autosave || !isDesktopRuntime()) return;

    const generation = ++autosaveGenerationRef.current;
    const timer = window.setTimeout(() => {
      const candidates = state.tabs.filter((tab) => tab.path && isDirty(tab));
      for (const tab of candidates) {
        const path = tab.path;
        if (!path) continue;

        void (async () => {
          try {
            if (unverifiedRecoveredPathsRef.current.has(path)) {
              if (!conflictWarningsRef.current.has(path)) {
                conflictWarningsRef.current.add(path);
                notify(
                  'warning',
                  `Autosave paused for recovered ${tab.title}. Save manually once to verify the disk copy.`,
                );
              }
              return;
            }

            if (await hasExternalChange(path)) {
              if (!conflictWarningsRef.current.has(path)) {
                conflictWarningsRef.current.add(path);
                notify(
                  'warning',
                  `${tab.title} changed outside Markora. Autosave paused to protect the external edits.`,
                );
              }
              return;
            }

            const saved = await saveMarkdownFile(path, tab.content, tab.title);
            if (!saved || generation !== autosaveGenerationRef.current) return;
            await rememberFingerprint(saved.path);
            setState((current) => ({
              ...current,
              tabs: current.tabs.map((item) =>
                item.id === tab.id && item.content === tab.content
                  ? { ...item, savedContent: item.content, path: saved.path, title: saved.name }
                  : item,
              ),
            }));
          } catch (error: unknown) {
            logger.error('autosave_failed', { message: errorMessage(error), path });
            notify('warning', `Autosave failed for ${tab.title}. Your recovery copy is still local.`);
          }
        })();
      }
    }, state.settings.autosaveDelayMs);

    return () => window.clearTimeout(timer);
  }, [
    hasExternalChange,
    notify,
    rememberFingerprint,
    state.settings.autosave,
    state.settings.autosaveDelayMs,
    state.tabs,
  ]);

  const setActiveId = useCallback((activeId: string) => {
    setState((current) =>
      current.tabs.some((tab) => tab.id === activeId) ? { ...current, activeId } : current,
    );
  }, []);

  const newTab = useCallback(() => {
    const tab = createDocument();
    setState((current) => ({ ...current, tabs: [...current.tabs, tab], activeId: tab.id }));
  }, []);

  const updateActiveContent = useCallback((content: string) => {
    setState((current) => ({
      ...current,
      tabs: current.tabs.map((tab) =>
        tab.id === current.activeId ? { ...tab, content, updatedAt: Date.now() } : tab,
      ),
    }));
  }, []);

  const updateCursorLine = useCallback((cursorLine: number) => {
    setState((current) => ({
      ...current,
      tabs: current.tabs.map((tab) =>
        tab.id === current.activeId ? { ...tab, cursorLine: Math.max(1, cursorLine) } : tab,
      ),
    }));
  }, []);

  const closeTab = useCallback((id: string) => {
    setState((current) => {
      const tab = current.tabs.find((item) => item.id === id);
      if (!tab) return current;
      if (isDirty(tab) && !window.confirm(`Close ${tab.title} without saving?`)) return current;

      if (tab.path) {
        diskFingerprintsRef.current.delete(tab.path);
        conflictWarningsRef.current.delete(tab.path);
        unverifiedRecoveredPathsRef.current.delete(tab.path);
      }

      const index = current.tabs.findIndex((item) => item.id === id);
      const remaining = current.tabs.filter((item) => item.id !== id);
      if (remaining.length === 0) {
        const replacement = createDocument();
        return { ...current, tabs: [replacement], activeId: replacement.id };
      }

      const nextActive =
        current.activeId === id
          ? (remaining[Math.min(index, remaining.length - 1)]?.id ?? remaining[0]!.id)
          : current.activeId;
      return { ...current, tabs: remaining, activeId: nextActive };
    });
  }, []);

  const openFile = useCallback(async () => {
    try {
      const opened = await openMarkdownFile();
      if (!opened) return;
      setState((current) => insertOpenedFile(current, opened.path, opened.name, opened.content));
      await rememberFingerprint(opened.path);
      notify('success', 'File opened.');
    } catch (error: unknown) {
      logger.error('open_file_failed', { message: errorMessage(error) });
      notify('error', errorMessage(error));
    }
  }, [notify, rememberFingerprint]);

  const openRecent = useCallback(
    async (path: string) => {
      try {
        const opened = await readMarkdownFile(path);
        setState((current) => insertOpenedFile(current, opened.path, opened.name, opened.content));
        await rememberFingerprint(opened.path);
        notify('success', 'File opened.');
      } catch (error: unknown) {
        logger.warn('open_recent_failed', { message: errorMessage(error), path });
        setState((current) => ({
          ...current,
          recentFiles: current.recentFiles.filter((file) => file.path !== path),
        }));
        notify('error', 'The recent file is no longer available.');
      }
    },
    [notify, rememberFingerprint],
  );

  const saveActive = useCallback(
    async (saveAs = false) => {
      const tab = state.tabs.find((item) => item.id === state.activeId);
      if (!tab) return;

      try {
        if (!saveAs && tab.path && isDesktopRuntime()) {
          if (unverifiedRecoveredPathsRef.current.has(tab.path)) {
            const overwrite = window.confirm(
              `${tab.title} was recovered from a previous session. Markora cannot verify whether the disk file changed while the app was closed. Overwrite the disk file with the recovered version?`,
            );
            if (!overwrite) return;
          } else if (await hasExternalChange(tab.path)) {
            const overwrite = window.confirm(
              `${tab.title} changed on disk since Markora opened or saved it. Overwrite those external changes?`,
            );
            if (!overwrite) {
              notify('warning', 'Save cancelled to protect the external file changes.');
              return;
            }
          }
        }

        const saved = await saveMarkdownFile(saveAs ? null : tab.path, tab.content, tab.title);
        if (!saved) return;
        await rememberFingerprint(saved.path);
        setState((current) => ({
          ...current,
          tabs: current.tabs.map((item) =>
            item.id === tab.id
              ? { ...item, path: saved.path, title: saved.name, savedContent: item.content }
              : item,
          ),
          recentFiles: saved.path
            ? addRecent(current.recentFiles, saved.path, saved.name)
            : current.recentFiles,
        }));
        notify('success', 'File saved.');
      } catch (error: unknown) {
        logger.error('save_file_failed', { message: errorMessage(error), path: tab.path });
        notify('error', errorMessage(error));
      }
    },
    [hasExternalChange, notify, rememberFingerprint, state.activeId, state.tabs],
  );

  const reloadActiveFromDisk = useCallback(async () => {
    const tab = state.tabs.find((item) => item.id === state.activeId);
    if (!tab?.path) {
      notify('info', 'This document is not connected to a disk file yet.');
      return;
    }

    if (isDirty(tab) && !window.confirm(`Reload ${tab.title} from disk and discard unsaved editor changes?`)) {
      return;
    }

    try {
      const opened = await readMarkdownFile(tab.path);
      setState((current) => ({
        ...current,
        tabs: current.tabs.map((item) =>
          item.id === tab.id
            ? {
                ...item,
                path: opened.path,
                title: opened.name,
                content: opened.content,
                savedContent: opened.content,
                updatedAt: Date.now(),
                cursorLine: 1,
              }
            : item,
        ),
        recentFiles: opened.path
          ? addRecent(current.recentFiles, opened.path, opened.name)
          : current.recentFiles,
      }));
      await rememberFingerprint(opened.path);
      notify('success', 'Reloaded the latest disk version.');
    } catch (error: unknown) {
      logger.warn('reload_file_failed', { message: errorMessage(error), path: tab.path });
      notify('error', errorMessage(error));
    }
  }, [notify, rememberFingerprint, state.activeId, state.tabs]);

  const exportHtml = useCallback(async () => {
    if (!activeTab) return;
    try {
      const html = renderMarkdownDocument(activeTab.content, activeTab.title);
      const result = await exportHtmlFile(html, activeTab.title);
      if (result) notify('success', 'HTML export created.');
    } catch (error: unknown) {
      logger.error('html_export_failed', { message: errorMessage(error) });
      notify('error', errorMessage(error));
    }
  }, [activeTab, notify]);

  const exportBackup = useCallback(async () => {
    try {
      const result = await saveBackupFile(exportBackupPayload(snapshot));
      if (result) notify('success', 'Workspace backup created.');
    } catch (error: unknown) {
      logger.error('backup_export_failed', { message: errorMessage(error) });
      notify('error', errorMessage(error));
    }
  }, [notify, snapshot]);

  const restoreBackup = useCallback(async () => {
    try {
      const raw = await openBackupFile();
      if (!raw) return;
      const restored = importBackupPayload(raw);
      if (!window.confirm('Replace the current workspace with this backup?')) return;
      diskFingerprintsRef.current.clear();
      conflictWarningsRef.current.clear();
      unverifiedRecoveredPathsRef.current = new Set(
        restored.tabs.flatMap((tab) => (tab.path && isDirty(tab) ? [tab.path] : [])),
      );
      setState({
        tabs: restored.tabs,
        activeId: restored.activeId,
        recentFiles: restored.recentFiles,
        settings: restored.settings,
        onboardingComplete: true,
      });
      saveOnboardingComplete(true);
      notify('success', 'Workspace restored from backup.');
    } catch (error: unknown) {
      logger.warn('backup_restore_failed', { message: errorMessage(error) });
      notify('error', errorMessage(error));
    }
  }, [notify]);

  const resetWorkspace = useCallback(() => {
    if (
      state.tabs.some(isDirty) &&
      !window.confirm('Reset the workspace and discard all unsaved recovery content?')
    ) {
      return;
    }

    clearWorkspace();
    diskFingerprintsRef.current.clear();
    conflictWarningsRef.current.clear();
    unverifiedRecoveredPathsRef.current.clear();
    const tab = createDocument();
    setState((current) => ({
      ...current,
      tabs: [tab],
      activeId: tab.id,
    }));
    notify('success', 'Workspace recovery was reset.');
  }, [notify, state.tabs]);

  const updateSettings = useCallback((patch: Partial<EditorSettings>) => {
    setState((current) => ({ ...current, settings: { ...current.settings, ...patch } }));
  }, []);

  const completeOnboarding = useCallback(() => {
    saveOnboardingComplete(true);
    setState((current) => ({ ...current, onboardingComplete: true }));
  }, []);

  return {
    state,
    activeTab,
    snapshot,
    toasts,
    recoveredWorkspace: initialRecoveryRef.current,
    setActiveId,
    newTab,
    updateActiveContent,
    updateCursorLine,
    closeTab,
    openFile,
    openRecent,
    saveActive,
    reloadActiveFromDisk,
    exportHtml,
    exportBackup,
    restoreBackup,
    resetWorkspace,
    updateSettings,
    completeOnboarding,
    notify,
  };
}

function insertOpenedFile(
  current: WorkspaceState,
  path: string | null,
  name: string,
  content: string,
): WorkspaceState {
  if (path) {
    const existing = current.tabs.find((tab) => tab.path === path);
    if (existing) {
      return {
        ...current,
        activeId: existing.id,
        recentFiles: addRecent(current.recentFiles, path, name),
      };
    }
  }

  const tab = createDocument(content, name || (path ? deriveFileName(path) : 'Untitled.md'), path);
  return {
    ...current,
    tabs: [...current.tabs, tab],
    activeId: tab.id,
    recentFiles: path ? addRecent(current.recentFiles, path, name) : current.recentFiles,
  };
}

function addRecent(files: RecentFile[], path: string, name: string): RecentFile[] {
  return [
    { path, name: name || deriveFileName(path), openedAt: Date.now() },
    ...files.filter((file) => file.path !== path),
  ].slice(0, 12);
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred.';
}
