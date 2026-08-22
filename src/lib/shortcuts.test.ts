import { beforeEach, describe, expect, it } from 'vitest';

import {
  bindingFromKeyboardEvent,
  eventMatchesShortcut,
  formatShortcutList,
  loadShortcutPreferences,
  resetShortcutPreferences,
  saveShortcutBinding,
} from './shortcuts';

describe('keyboard shortcuts', () => {
  beforeEach(() => localStorage.clear());

  it('loads the expected default aliases', () => {
    const shortcuts = loadShortcutPreferences();
    expect(eventMatchesShortcut(
      { key: 'k', ctrlKey: true, metaKey: false, shiftKey: false, altKey: false },
      shortcuts,
      'palette',
    )).toBe(true);
    expect(eventMatchesShortcut(
      { key: 'P', ctrlKey: true, metaKey: false, shiftKey: true, altKey: false },
      shortcuts,
      'palette',
    )).toBe(true);
  });

  it('captures only Ctrl/Command based non-modifier bindings', () => {
    expect(bindingFromKeyboardEvent(
      { key: 'g', ctrlKey: false, metaKey: false, shiftKey: false, altKey: false },
    )).toBeNull();
    expect(bindingFromKeyboardEvent(
      { key: 'Control', ctrlKey: true, metaKey: false, shiftKey: false, altKey: false },
    )).toBeNull();
    expect(bindingFromKeyboardEvent(
      { key: 'G', ctrlKey: true, metaKey: false, shiftKey: true, altKey: false },
    )).toEqual({ key: 'g', shift: true, alt: false });
  });

  it('persists a custom binding and rejects collisions', () => {
    const shortcuts = saveShortcutBinding('find', { key: 'g', shift: true, alt: false });
    expect(formatShortcutList(shortcuts, 'find')).toBe('Ctrl/⌘ Shift G');
    expect(eventMatchesShortcut(
      { key: 'g', ctrlKey: false, metaKey: true, shiftKey: true, altKey: false },
      shortcuts,
      'find',
    )).toBe(true);
    expect(() => saveShortcutBinding('bold', { key: 'g', shift: true, alt: false })).toThrow(
      'already assigned to Find and replace',
    );
  });

  it('resets custom bindings without touching unrelated local storage', () => {
    localStorage.setItem('markora.workspace.v1', 'keep');
    saveShortcutBinding('find', { key: 'g', shift: true, alt: false });
    const reset = resetShortcutPreferences();

    expect(formatShortcutList(reset, 'find')).toBe('Ctrl/⌘ F');
    expect(localStorage.getItem('markora.workspace.v1')).toBe('keep');
  });
});
