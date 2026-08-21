import { beforeEach, describe, expect, it } from 'vitest';

import {
  DEFAULT_LAYOUT,
  clampEditorPanePercent,
  loadLayoutPreferences,
  resetLayoutPreferences,
  saveLayoutPreferences,
} from './layout';

describe('layout preferences', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads defaults when no preference exists', () => {
    expect(loadLayoutPreferences()).toEqual(DEFAULT_LAYOUT);
  });

  it('persists a validated layout mode and ratio', () => {
    saveLayoutPreferences({ version: 1, mode: 'preview', editorPanePercent: 63 });
    expect(loadLayoutPreferences()).toEqual({ version: 1, mode: 'preview', editorPanePercent: 63 });
  });

  it('clamps pane ratios to readable limits', () => {
    expect(clampEditorPanePercent(5)).toBe(30);
    expect(clampEditorPanePercent(95)).toBe(70);
  });

  it('recovers safely from malformed storage', () => {
    localStorage.setItem('markora.layout.v1', '{not-json');
    expect(loadLayoutPreferences()).toEqual(DEFAULT_LAYOUT);
  });

  it('resets persisted preferences', () => {
    saveLayoutPreferences({ version: 1, mode: 'editor', editorPanePercent: 60 });
    expect(resetLayoutPreferences()).toEqual(DEFAULT_LAYOUT);
    expect(loadLayoutPreferences()).toEqual(DEFAULT_LAYOUT);
  });
});
