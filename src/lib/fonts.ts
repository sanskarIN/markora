import type { FontPreset } from '../types';

export interface LocalFontPreset {
  id: FontPreset;
  label: string;
  description: string;
  stack: string;
}

export const LOCAL_FONT_PRESETS: readonly LocalFontPreset[] = [
  {
    id: 'system-sans',
    label: 'System sans',
    description: 'Uses the native UI font already installed on your operating system.',
    stack: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  {
    id: 'system-serif',
    label: 'System serif',
    description: 'Uses common local serif fonts for a book-like writing surface.',
    stack: 'Georgia, "Times New Roman", Times, serif',
  },
  {
    id: 'system-mono',
    label: 'System monospace',
    description: 'Uses local monospace fonts for code-heavy Markdown.',
    stack: 'ui-monospace, "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
  },
  {
    id: 'humanist-sans',
    label: 'Humanist sans',
    description: 'Prefers readable local humanist sans-serif fonts with safe fallbacks.',
    stack: '"Segoe UI", Candara, Calibri, "Trebuchet MS", system-ui, sans-serif',
  },
  {
    id: 'reading-serif',
    label: 'Reading serif',
    description: 'Prefers locally installed reading-focused serif fonts with standard fallbacks.',
    stack: 'Charter, Cambria, Georgia, "Times New Roman", serif',
  },
] as const;

const FONT_PRESET_IDS = new Set<FontPreset>(LOCAL_FONT_PRESETS.map((preset) => preset.id));

export function isFontPreset(value: unknown): value is FontPreset {
  return typeof value === 'string' && FONT_PRESET_IDS.has(value as FontPreset);
}

export function normalizeFontPreset(value: unknown): FontPreset {
  return isFontPreset(value) ? value : 'system-sans';
}

export function getLocalFontStack(preset: FontPreset): string {
  return LOCAL_FONT_PRESETS.find((candidate) => candidate.id === preset)?.stack ?? LOCAL_FONT_PRESETS[0].stack;
}
