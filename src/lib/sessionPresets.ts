import { clampEditorPanePercent, DEFAULT_LAYOUT, type LayoutMode, type LayoutPreferences } from './layout';
import { normalizeEditorSettings } from './storage';
import type { EditorSettings } from '../types';

const SESSION_PRESETS_KEY = 'markora.session-presets.v1';
const MAX_SESSION_PRESETS = 12;

export interface SessionPresetV1 {
  version: 1;
  id: string;
  name: string;
  createdAt: number;
  settings: EditorSettings;
  layout: LayoutPreferences;
}

export function loadSessionPresets(): SessionPresetV1[] {
  if (typeof localStorage === 'undefined') return [];

  try {
    const raw = localStorage.getItem(SESSION_PRESETS_KEY);
    if (!raw || new Blob([raw]).size > 256 * 1024) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.flatMap((value) => {
      const preset = normalizeSessionPreset(value);
      return preset ? [preset] : [];
    }).slice(0, MAX_SESSION_PRESETS);
  } catch {
    return [];
  }
}

export function saveSessionPreset(
  name: string,
  settings: EditorSettings,
  layout: LayoutPreferences,
): SessionPresetV1[] {
  const normalizedName = normalizeName(name);
  if (!normalizedName) throw new Error('Preset name is required.');

  const current = loadSessionPresets();
  const now = Date.now();
  const preset: SessionPresetV1 = {
    version: 1,
    id: `preset-${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    name: normalizedName,
    createdAt: now,
    settings: normalizeEditorSettings(settings),
    layout: normalizeLayout(layout),
  };
  const next = [preset, ...current.filter((item) => item.name.toLocaleLowerCase() !== normalizedName.toLocaleLowerCase())]
    .slice(0, MAX_SESSION_PRESETS);
  persistSessionPresets(next);
  return next;
}

export function deleteSessionPreset(id: string): SessionPresetV1[] {
  const next = loadSessionPresets().filter((preset) => preset.id !== id);
  persistSessionPresets(next);
  return next;
}

export function clearSessionPresets(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(SESSION_PRESETS_KEY);
  } catch {
    // Optional convenience state must never interrupt editing.
  }
}

function persistSessionPresets(presets: SessionPresetV1[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(SESSION_PRESETS_KEY, JSON.stringify(presets.slice(0, MAX_SESSION_PRESETS)));
  } catch {
    throw new Error('Could not save the session preset locally.');
  }
}

function normalizeSessionPreset(value: unknown): SessionPresetV1 | null {
  if (!isRecord(value) || value.version !== 1) return null;
  const name = normalizeName(value.name);
  if (!name || typeof value.id !== 'string' || !value.id.trim()) return null;

  return {
    version: 1,
    id: value.id.slice(0, 96),
    name,
    createdAt:
      typeof value.createdAt === 'number' && Number.isFinite(value.createdAt) ? value.createdAt : Date.now(),
    settings: normalizeEditorSettings(value.settings),
    layout: normalizeLayout(value.layout),
  };
}

function normalizeLayout(value: unknown): LayoutPreferences {
  if (!isRecord(value)) return DEFAULT_LAYOUT;
  const mode: LayoutMode = isLayoutMode(value.mode) ? value.mode : DEFAULT_LAYOUT.mode;
  const editorPanePercent =
    typeof value.editorPanePercent === 'number' && Number.isFinite(value.editorPanePercent)
      ? clampEditorPanePercent(value.editorPanePercent)
      : DEFAULT_LAYOUT.editorPanePercent;
  return { version: 1, mode, editorPanePercent };
}

function normalizeName(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').slice(0, 48);
}

function isLayoutMode(value: unknown): value is LayoutMode {
  return value === 'split' || value === 'editor' || value === 'preview';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
