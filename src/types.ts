export type ThemeMode = 'system' | 'light' | 'dark';
export type EditorTheme = 'graphite' | 'aurora' | 'paper';
export type FontPreset = 'system-sans' | 'system-serif' | 'system-mono' | 'humanist-sans' | 'reading-serif';
export type PrintPageSize = 'auto' | 'a4' | 'letter';
export type PanelMode = 'outline' | 'recent' | 'statistics';

export interface EditorSettings {
  themeMode: ThemeMode;
  editorTheme: EditorTheme;
  fontPreset: FontPreset;
  fontSize: number;
  lineHeight: number;
  wordWrap: boolean;
  autosave: boolean;
  autosaveDelayMs: number;
  reducedMotion: boolean;
  showOutline: boolean;
  showPreview: boolean;
  printPageSize: PrintPageSize;
  printMarginMm: number;
  printKeepHeadings: boolean;
  printCodeWrap: boolean;
  printMetadata: boolean;
}

export const DEFAULT_SETTINGS: EditorSettings = {
  themeMode: 'system',
  editorTheme: 'graphite',
  fontPreset: 'system-sans',
  fontSize: 16,
  lineHeight: 1.65,
  wordWrap: true,
  autosave: true,
  autosaveDelayMs: 1800,
  reducedMotion: false,
  showOutline: true,
  showPreview: true,
  printPageSize: 'auto',
  printMarginMm: 18,
  printKeepHeadings: true,
  printCodeWrap: true,
  printMetadata: true,
};

export interface DocumentTab {
  id: string;
  title: string;
  path: string | null;
  content: string;
  savedContent: string;
  updatedAt: number;
  cursorLine: number;
}

export interface RecentFile {
  path: string;
  name: string;
  openedAt: number;
}

export interface HeadingItem {
  id: string;
  level: number;
  text: string;
  line: number;
}

export interface OpenedFile {
  path: string | null;
  name: string;
  content: string;
}

export interface SavedFile {
  path: string | null;
  name: string;
}

export interface WorkspaceSnapshot {
  version: 1;
  activeId: string;
  tabs: DocumentTab[];
  recentFiles: RecentFile[];
  settings: EditorSettings;
  onboardingComplete: boolean;
  savedAt: number;
}

export interface ToastMessage {
  id: string;
  tone: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

export interface CommandAction {
  id: string;
  label: string;
  shortcut: string | null;
  keywords: string[];
  run: () => void | Promise<void>;
}
