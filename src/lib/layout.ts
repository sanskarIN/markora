export type LayoutMode = 'split' | 'editor' | 'preview';

export interface LayoutPreferences {
  version: 1;
  mode: LayoutMode;
  editorPanePercent: number;
}

export const DEFAULT_LAYOUT: LayoutPreferences = {
  version: 1,
  mode: 'split',
  editorPanePercent: 50,
};

const LAYOUT_KEY = 'markora.layout.v1';
const MIN_EDITOR_PERCENT = 30;
const MAX_EDITOR_PERCENT = 70;

export function loadLayoutPreferences(): LayoutPreferences {
  if (typeof localStorage === 'undefined') return DEFAULT_LAYOUT;

  try {
    const raw = localStorage.getItem(LAYOUT_KEY);
    if (!raw) return DEFAULT_LAYOUT;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.version !== 1) return DEFAULT_LAYOUT;

    const mode = isLayoutMode(parsed.mode) ? parsed.mode : DEFAULT_LAYOUT.mode;
    const editorPanePercent =
      typeof parsed.editorPanePercent === 'number' && Number.isFinite(parsed.editorPanePercent)
        ? clamp(Math.round(parsed.editorPanePercent), MIN_EDITOR_PERCENT, MAX_EDITOR_PERCENT)
        : DEFAULT_LAYOUT.editorPanePercent;

    return { version: 1, mode, editorPanePercent };
  } catch {
    return DEFAULT_LAYOUT;
  }
}

export function saveLayoutPreferences(preferences: LayoutPreferences): void {
  if (typeof localStorage === 'undefined') return;

  const normalized: LayoutPreferences = {
    version: 1,
    mode: isLayoutMode(preferences.mode) ? preferences.mode : DEFAULT_LAYOUT.mode,
    editorPanePercent: clamp(
      Math.round(preferences.editorPanePercent),
      MIN_EDITOR_PERCENT,
      MAX_EDITOR_PERCENT,
    ),
  };

  try {
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(normalized));
  } catch {
    // Layout persistence is optional and must never interrupt editing.
  }
}

export function resetLayoutPreferences(): LayoutPreferences {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem(LAYOUT_KEY);
    } catch {
      // Falling back to defaults is sufficient when storage is unavailable.
    }
  }
  return DEFAULT_LAYOUT;
}

export function clampEditorPanePercent(value: number): number {
  return clamp(Math.round(value), MIN_EDITOR_PERCENT, MAX_EDITOR_PERCENT);
}

function isLayoutMode(value: unknown): value is LayoutMode {
  return value === 'split' || value === 'editor' || value === 'preview';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
