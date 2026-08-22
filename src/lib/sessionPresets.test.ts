import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_LAYOUT } from './layout';
import { clearSessionPresets, deleteSessionPreset, loadSessionPresets, saveSessionPreset } from './sessionPresets';
import { DEFAULT_SETTINGS } from '../types';

describe('session presets', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('stores settings and layout without document content', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
    vi.spyOn(Math, 'random').mockReturnValue(0.25);

    const presets = saveSessionPreset('Writing', { ...DEFAULT_SETTINGS, fontSize: 19 }, {
      ...DEFAULT_LAYOUT,
      mode: 'editor',
      editorPanePercent: 67,
    });

    expect(presets).toHaveLength(1);
    expect(presets[0]).toMatchObject({
      name: 'Writing',
      settings: { fontSize: 19 },
      layout: { mode: 'editor', editorPanePercent: 67 },
    });
    expect(JSON.stringify(presets[0])).not.toContain('content');
    expect(loadSessionPresets()[0]?.name).toBe('Writing');
  });

  it('replaces a preset with the same normalized name and clamps layout', () => {
    saveSessionPreset('Review', DEFAULT_SETTINGS, { ...DEFAULT_LAYOUT, editorPanePercent: 50 });
    const presets = saveSessionPreset('  Review  ', DEFAULT_SETTINGS, {
      ...DEFAULT_LAYOUT,
      editorPanePercent: 999,
    });

    expect(presets).toHaveLength(1);
    expect(presets[0]?.layout.editorPanePercent).toBe(70);
  });

  it('deletes and clears presets without affecting other workspace storage', () => {
    localStorage.setItem('markora.workspace.v1', 'keep');
    const saved = saveSessionPreset('One', DEFAULT_SETTINGS, DEFAULT_LAYOUT);
    expect(deleteSessionPreset(saved[0]!.id)).toHaveLength(0);
    saveSessionPreset('Two', DEFAULT_SETTINGS, DEFAULT_LAYOUT);
    clearSessionPresets();

    expect(loadSessionPresets()).toEqual([]);
    expect(localStorage.getItem('markora.workspace.v1')).toBe('keep');
  });
});
