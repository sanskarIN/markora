import { beforeEach, describe, expect, it } from 'vitest';

import { createDocument, isDirty } from './document';
import {
  exportBackupPayload,
  importBackupPayload,
  loadWorkspace,
  saveWorkspace,
} from './storage';
import { DEFAULT_SETTINGS, type WorkspaceSnapshot } from '../types';

describe('workspace storage', () => {
  beforeEach(() => localStorage.clear());

  it('round trips a versioned recovery snapshot', () => {
    const tab = createDocument('# Test', 'Test.md');
    const snapshot: WorkspaceSnapshot = {
      version: 1,
      activeId: tab.id,
      tabs: [tab],
      recentFiles: [],
      settings: DEFAULT_SETTINGS,
      onboardingComplete: true,
      savedAt: Date.now(),
    };

    expect(saveWorkspace(snapshot)).toEqual({ ok: true });
    expect(loadWorkspace()?.tabs[0]?.content).toBe('# Test');
  });

  it('preserves unsaved editor content after a simulated abrupt restart', () => {
    const tab = createDocument('# Saved version', 'Recovery.md', '/notes/Recovery.md');
    const dirtyTab = {
      ...tab,
      content: '# Unsaved version\n\nRecovered after restart.',
      updatedAt: tab.updatedAt + 1,
    };
    const snapshot: WorkspaceSnapshot = {
      version: 1,
      activeId: dirtyTab.id,
      tabs: [dirtyTab],
      recentFiles: [],
      settings: DEFAULT_SETTINGS,
      onboardingComplete: true,
      savedAt: Date.now(),
    };

    expect(isDirty(dirtyTab)).toBe(true);
    expect(saveWorkspace(snapshot)).toEqual({ ok: true });

    const restarted = loadWorkspace();
    expect(restarted?.tabs[0]?.content).toBe('# Unsaved version\n\nRecovered after restart.');
    expect(restarted?.tabs[0]?.savedContent).toBe('# Saved version');
    expect(restarted?.tabs[0] ? isDirty(restarted.tabs[0]) : false).toBe(true);
    expect(restarted?.tabs[0]?.path).toBe('/notes/Recovery.md');
  });

  it('migrates legacy settings without newer appearance and print preferences', () => {
    const tab = createDocument('# Legacy', 'Legacy.md');
    const snapshot: WorkspaceSnapshot = {
      version: 1,
      activeId: tab.id,
      tabs: [tab],
      recentFiles: [],
      settings: DEFAULT_SETTINGS,
      onboardingComplete: true,
      savedAt: Date.now(),
    };
    const legacy = JSON.parse(JSON.stringify(snapshot)) as { settings: Record<string, unknown> };
    delete legacy.settings.fontPreset;
    delete legacy.settings.printPageSize;
    delete legacy.settings.printMarginMm;
    delete legacy.settings.printKeepHeadings;
    delete legacy.settings.printCodeWrap;
    delete legacy.settings.printMetadata;
    localStorage.setItem('markora.workspace.v1', JSON.stringify(legacy));

    const settings = loadWorkspace()?.settings;
    expect(settings?.fontPreset).toBe(DEFAULT_SETTINGS.fontPreset);
    expect(settings?.printPageSize).toBe(DEFAULT_SETTINGS.printPageSize);
    expect(settings?.printMarginMm).toBe(DEFAULT_SETTINGS.printMarginMm);
    expect(settings?.printKeepHeadings).toBe(DEFAULT_SETTINGS.printKeepHeadings);
    expect(settings?.printCodeWrap).toBe(DEFAULT_SETTINGS.printCodeWrap);
    expect(settings?.printMetadata).toBe(DEFAULT_SETTINGS.printMetadata);
  });

  it('rejects malformed workspace data instead of trusting it', () => {
    localStorage.setItem('markora.workspace.v1', '{"version":1,"tabs":"oops"}');
    expect(loadWorkspace()).toBeNull();
  });

  it('exports and imports a Markora backup envelope', () => {
    const tab = createDocument('Backup me');
    const snapshot: WorkspaceSnapshot = {
      version: 1,
      activeId: tab.id,
      tabs: [tab],
      recentFiles: [],
      settings: DEFAULT_SETTINGS,
      onboardingComplete: true,
      savedAt: Date.now(),
    };

    const restored = importBackupPayload(exportBackupPayload(snapshot));
    expect(restored.tabs[0]?.content).toBe('Backup me');
  });

  it('rejects arbitrary JSON that is not a Markora backup', () => {
    expect(() => importBackupPayload('{"hello":"world"}')).toThrow('not a Markora backup');
  });
});
