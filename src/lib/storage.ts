import { DEFAULT_SETTINGS, type DocumentTab, type EditorSettings, type RecentFile, type WorkspaceSnapshot } from '../types';
import { normalizeFontPreset } from './fonts';
import { normalizePrintMarginMm, normalizePrintPageSize } from './print';

const WORKSPACE_KEY = 'markora.workspace.v1';
const ONBOARDING_KEY = 'markora.onboarding.v1';
const MAX_RECOVERY_BYTES = 4 * 1024 * 1024;

export type StorageResult = { ok: true } | { ok: false; reason: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isDocumentTab(value: unknown): value is DocumentTab {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    (typeof value.path === 'string' || value.path === null) &&
    typeof value.content === 'string' &&
    typeof value.savedContent === 'string' &&
    typeof value.updatedAt === 'number' &&
    Number.isFinite(value.updatedAt) &&
    typeof value.cursorLine === 'number' &&
    Number.isInteger(value.cursorLine) &&
    value.cursorLine >= 1
  );
}

function isRecentFile(value: unknown): value is RecentFile {
  if (!isRecord(value)) return false;
  return (
    typeof value.path === 'string' &&
    typeof value.name === 'string' &&
    typeof value.openedAt === 'number' &&
    Number.isFinite(value.openedAt)
  );
}

export function normalizeEditorSettings(value: unknown): EditorSettings {
  if (!isRecord(value)) return DEFAULT_SETTINGS;

  const themeMode = value.themeMode;
  const editorTheme = value.editorTheme;
  return {
    themeMode: themeMode === 'light' || themeMode === 'dark' || themeMode === 'system' ? themeMode : DEFAULT_SETTINGS.themeMode,
    editorTheme:
      editorTheme === 'graphite' || editorTheme === 'aurora' || editorTheme === 'paper'
        ? editorTheme
        : DEFAULT_SETTINGS.editorTheme,
    fontPreset: normalizeFontPreset(value.fontPreset),
    fontSize:
      typeof value.fontSize === 'number' && value.fontSize >= 12 && value.fontSize <= 28
        ? value.fontSize
        : DEFAULT_SETTINGS.fontSize,
    lineHeight:
      typeof value.lineHeight === 'number' && value.lineHeight >= 1.2 && value.lineHeight <= 2.2
        ? value.lineHeight
        : DEFAULT_SETTINGS.lineHeight,
    wordWrap: typeof value.wordWrap === 'boolean' ? value.wordWrap : DEFAULT_SETTINGS.wordWrap,
    autosave: typeof value.autosave === 'boolean' ? value.autosave : DEFAULT_SETTINGS.autosave,
    autosaveDelayMs:
      typeof value.autosaveDelayMs === 'number' && value.autosaveDelayMs >= 500 && value.autosaveDelayMs <= 30_000
        ? value.autosaveDelayMs
        : DEFAULT_SETTINGS.autosaveDelayMs,
    reducedMotion:
      typeof value.reducedMotion === 'boolean' ? value.reducedMotion : DEFAULT_SETTINGS.reducedMotion,
    showOutline:
      typeof value.showOutline === 'boolean' ? value.showOutline : DEFAULT_SETTINGS.showOutline,
    showPreview:
      typeof value.showPreview === 'boolean' ? value.showPreview : DEFAULT_SETTINGS.showPreview,
    printPageSize: normalizePrintPageSize(value.printPageSize),
    printMarginMm: normalizePrintMarginMm(value.printMarginMm),
    printKeepHeadings:
      typeof value.printKeepHeadings === 'boolean'
        ? value.printKeepHeadings
        : DEFAULT_SETTINGS.printKeepHeadings,
    printCodeWrap:
      typeof value.printCodeWrap === 'boolean' ? value.printCodeWrap : DEFAULT_SETTINGS.printCodeWrap,
    printMetadata:
      typeof value.printMetadata === 'boolean' ? value.printMetadata : DEFAULT_SETTINGS.printMetadata,
  };
}

export function loadWorkspace(): WorkspaceSnapshot | null {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(WORKSPACE_KEY);
  if (!raw) return null;

  try {
    return parseWorkspace(raw);
  } catch {
    return null;
  }
}

export function saveWorkspace(snapshot: WorkspaceSnapshot): StorageResult {
  if (typeof localStorage === 'undefined') return { ok: false, reason: 'Storage is unavailable.' };

  try {
    const raw = JSON.stringify(snapshot);
    if (new Blob([raw]).size > MAX_RECOVERY_BYTES) {
      return { ok: false, reason: 'Recovery snapshot exceeds the local storage safety limit.' };
    }
    localStorage.setItem(WORKSPACE_KEY, raw);
    return { ok: true };
  } catch {
    return { ok: false, reason: 'Could not persist the recovery snapshot.' };
  }
}

export function clearWorkspace(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(WORKSPACE_KEY);
}

export function loadOnboardingComplete(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(ONBOARDING_KEY) === 'complete';
}

export function saveOnboardingComplete(complete: boolean): void {
  if (typeof localStorage === 'undefined') return;
  if (complete) localStorage.setItem(ONBOARDING_KEY, 'complete');
  else localStorage.removeItem(ONBOARDING_KEY);
}

export function exportBackupPayload(snapshot: WorkspaceSnapshot): string {
  return JSON.stringify(
    {
      format: 'markora-backup',
      exportedAt: new Date().toISOString(),
      workspace: snapshot,
    },
    null,
    2,
  );
}

export function importBackupPayload(raw: string): WorkspaceSnapshot {
  const parsed: unknown = JSON.parse(raw);
  if (!isRecord(parsed) || parsed.format !== 'markora-backup') {
    throw new Error('This is not a Markora backup file.');
  }
  return parseWorkspace(JSON.stringify(parsed.workspace));
}

function parseWorkspace(raw: string): WorkspaceSnapshot {
  const parsed: unknown = JSON.parse(raw);
  if (!isRecord(parsed) || parsed.version !== 1) throw new Error('Unsupported workspace version.');
  if (!Array.isArray(parsed.tabs) || !parsed.tabs.every(isDocumentTab)) throw new Error('Invalid tabs.');
  if (parsed.tabs.length === 0 || parsed.tabs.length > 30) throw new Error('Invalid tab count.');
  if (typeof parsed.activeId !== 'string' || !parsed.tabs.some((tab) => tab.id === parsed.activeId)) {
    throw new Error('Invalid active tab.');
  }

  const recentFiles = Array.isArray(parsed.recentFiles)
    ? parsed.recentFiles.filter(isRecentFile).slice(0, 20)
    : [];

  return {
    version: 1,
    activeId: parsed.activeId,
    tabs: parsed.tabs,
    recentFiles,
    settings: normalizeEditorSettings(parsed.settings),
    onboardingComplete:
      typeof parsed.onboardingComplete === 'boolean' ? parsed.onboardingComplete : false,
    savedAt: typeof parsed.savedAt === 'number' && Number.isFinite(parsed.savedAt) ? parsed.savedAt : Date.now(),
  };
}
