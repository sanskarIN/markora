import { beforeEach, describe, expect, it } from 'vitest';

import { createDocument } from './document';
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
