import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useI18n, type AppTranslationKey, type TranslationValues } from '../i18n';
import { createDocument, createId, deriveFileName, isDirty, WELCOME_MARKDOWN } from '../lib/document';
import { limitDroppedItems, readDroppedBrowserFile } from '../lib/fileDrop';
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
import {
  DEFAULT_SETTINGS,
  type DocumentTab,
  type EditorSettings,
  type RecentFile,
  type ToastMessage,
  type WorkspaceSnapshot,
} from '../types';

interface WorkspaceState {
  tabs: DocumentTab[];
  activeId: string;
  recentFiles: RecentFile[];
  settings: EditorSettings;
  onboardingComplete: boolean;
}

type Translator = (key: AppTranslationKey, values?: TranslationValues) => string;

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
  const { t, locale } = useI18n();
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
      logger.warn('file_fingerprint_failed', { message: errorMessage(error) });
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
                notify('warning', t('autosaveRecoveredPaused', { title: tab.title }));
              }
              return;
            }

            if (await hasExternalChange(path)) {
              if (!conflictWarningsRef.current.has(path)) {
                conflictWarningsRef.current.add(path);
                notify('warning', t('autosaveExternalPaused', { title: tab.title }));
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
            logger.error('autosave_failed', { message: errorMessage(error) });
            notify('warning', t('autosaveFailed', { title: tab.title }));
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
    t,
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
      if (isDirty(tab) && !window.confirm(t('closeUnsavedConfirm', { title: tab.title }))) return current;

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
  }, [t]);

  const openFile = useCallback(async () => {
    try {
      const opened = await openMarkdownFile();
      if (!opened) return;
      setState((current) => insertOpenedFile(current, opened.path, opened.name, opened.content));
      await rememberFingerprint(opened.path);
      notify('success', t('fileOpened'));
    } catch (error: unknown) {
      logger.error('open_file_failed', { message: errorMessage(error) });
      notify('error', errorMessage(error, t('unexpectedError')));
    }
  }, [notify, rememberFingerprint, t]);

  const openRecent = useCallback(
    async (path: string) => {
      try {
        const opened = await readMarkdownFile(path);
        setState((current) => insertOpenedFile(current, opened.path, opened.name, opened.content));
        await rememberFingerprint(opened.path);
        notify('success', t('fileOpened'));
      } catch (error: unknown) {
        logger.warn('open_recent_failed', { message: errorMessage(error) });
        setState((current) => ({
          ...current,
          recentFiles: current.recentFiles.filter((file) => file.path !== path),
        }));
        notify('error', t('recentUnavailable'));
      }
    },
    [notify, rememberFingerprint, t],
  );

  const openDroppedPaths = useCallback(
    async (paths: string[]) => {
      const uniquePaths = Array.from(new Set(paths));
      const limited = limitDroppedItems(uniquePaths);
      let openedCount = 0;
      let failedCount = 0;
      let lastError = '';

      for (const path of limited) {
        try {
          const opened = await readMarkdownFile(path);
          setState((current) => insertOpenedFile(current, opened.path, opened.name, opened.content));
          await rememberFingerprint(opened.path);
          openedCount += 1;
        } catch (error: unknown) {
          failedCount += 1;
          lastError = errorMessage(error);
          logger.warn('drop_open_failed', { message: lastError });
        }
      }

      notifyDroppedFileResult(notify, t, openedCount, failedCount, uniquePaths.length - limited.length, lastError);
    },
    [notify, rememberFingerprint, t],
  );

  const openDroppedBrowserFiles = useCallback(
    async (files: File[]) => {
      const limited = limitDroppedItems(files);
      let openedCount = 0;
      let failedCount = 0;
      let lastError = '';

      for (const file of limited) {
        try {
          const opened = await readDroppedBrowserFile(file);
          setState((current) => insertOpenedFile(current, null, opened.name, opened.content));
          openedCount += 1;
        } catch (error: unknown) {
          failedCount += 1;
          lastError = errorMessage(error);
          logger.warn('browser_drop_open_failed', { message: lastError });
        }
      }

      notifyDroppedFileResult(notify, t, openedCount, failedCount, files.length - limited.length, lastError);
    },
    [notify, t],
  );

  const saveActive = useCallback(
    async (saveAs = false) => {
      const tab = state.tabs.find((item) => item.id === state.activeId);
      if (!tab) return;

      try {
        if (!saveAs && tab.path && isDesktopRuntime()) {
          if (unverifiedRecoveredPathsRef.current.has(tab.path)) {
            const overwrite = window.confirm(t('recoveredOverwriteConfirm', { title: tab.title }));
            if (!overwrite) return;
          } else if (await hasExternalChange(tab.path)) {
            const overwrite = window.confirm(t('externalOverwriteConfirm', { title: tab.title }));
            if (!overwrite) {
              notify('warning', t('saveCancelledExternal'));
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
        notify('success', t('fileSaved'));
      } catch (error: unknown) {
        logger.error('save_file_failed', { message: errorMessage(error) });
        notify('error', errorMessage(error, t('unexpectedError')));
      }
    },
    [hasExternalChange, notify, rememberFingerprint, state.activeId, state.tabs, t],
  );

  const reloadActiveFromDisk = useCallback(async () => {
    const tab = state.tabs.find((item) => item.id === state.activeId);
    if (!tab?.path) {
      notify('info', t('notDiskConnected'));
      return;
    }

    if (isDirty(tab) && !window.confirm(t('reloadDiscardConfirm', { title: tab.title }))) {
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
      notify('success', t('reloadedDisk'));
    } catch (error: unknown) {
      logger.warn('reload_file_failed', { message: errorMessage(error) });
      notify('error', errorMessage(error, t('unexpectedError')));
    }
  }, [notify, rememberFingerprint, state.activeId, state.tabs, t]);

  const exportHtml = useCallback(async () => {
    if (!activeTab) return;
    try {
      const html = renderMarkdownDocument(activeTab.content, activeTab.title, {
        lang: locale,
        imageLabel: t('blockedImage'),
      });
      const result = await exportHtmlFile(html, activeTab.title);
      if (result) notify('success', t('htmlExportCreated'));
    } catch (error: unknown) {
      logger.error('html_export_failed', { message: errorMessage(error) });
      notify('error', errorMessage(error, t('unexpectedError')));
    }
  }, [activeTab, locale, notify, t]);

  const exportBackup = useCallback(async () => {
    try {
      const result = await saveBackupFile(exportBackupPayload(snapshot));
      if (result) notify('success', t('backupCreated'));
    } catch (error: unknown) {
      logger.error('backup_export_failed', { message: errorMessage(error) });
      notify('error', errorMessage(error, t('unexpectedError')));
    }
  }, [notify, snapshot, t]);

  const restoreBackup = useCallback(async () => {
    try {
      const raw = await openBackupFile();
      if (!raw) return;
      const restored = importBackupPayload(raw);
      if (!window.confirm(t('replaceWorkspaceConfirm'))) return;
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
      notify('success', t('workspaceRestored'));
    } catch (error: unknown) {
      logger.warn('backup_restore_failed', { message: errorMessage(error) });
      notify('error', errorMessage(error, t('unexpectedError')));
    }
  }, [notify, t]);

  const resetWorkspace = useCallback(() => {
    if (state.tabs.some(isDirty) && !window.confirm(t('resetWorkspaceConfirm'))) {
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
    notify('success', t('workspaceReset'));
  }, [notify, state.tabs, t]);

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
    openDroppedPaths,
    openDroppedBrowserFiles,
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

function notifyDroppedFileResult(
  notify: (tone: ToastMessage['tone'], message: string) => void,
  t: Translator,
  openedCount: number,
  failedCount: number,
  ignoredCount: number,
  lastError: string,
): void {
  if (openedCount > 0) {
    notify(
      'success',
      openedCount === 1
        ? t('droppedOpenedOne', { count: openedCount })
        : t('droppedOpenedMany', { count: openedCount }),
    );
  }
  if (failedCount > 0) {
    const detail = lastError ? ` ${lastError}` : '';
    notify(
      'warning',
      failedCount === 1
        ? t('droppedSkippedOne', { count: failedCount, detail })
        : t('droppedSkippedMany', { count: failedCount, detail }),
    );
  }
  if (ignoredCount > 0) {
    notify(
      'warning',
      ignoredCount === 1
        ? t('droppedIgnoredOne', { count: ignoredCount })
        : t('droppedIgnoredMany', { count: ignoredCount }),
    );
  }
}

function errorMessage(error: unknown, fallback = 'An unexpected error occurred.'): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return fallback;
}
