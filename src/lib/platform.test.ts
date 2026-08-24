import { afterEach, describe, expect, it } from 'vitest';

import packageMetadata from '../../package.json';
import {
  BUILD_VERSION,
  fileNameFromPath,
  getAppVersion,
  isDesktopRuntime,
  isMobileRuntime,
  isTauriRuntime,
} from './platform';

afterEach(() => {
  Reflect.deleteProperty(window, '__TAURI_INTERNALS__');
});

describe('platform runtime detection', () => {
  it('treats a normal browser as web runtime', () => {
    expect(isTauriRuntime()).toBe(false);
    expect(isMobileRuntime('Mozilla/5.0 (Linux; Android 15)')).toBe(false);
    expect(isDesktopRuntime()).toBe(false);
  });

  it('detects Android only when running inside Tauri', () => {
    Object.defineProperty(window, '__TAURI_INTERNALS__', {
      configurable: true,
      value: {},
    });

    expect(isTauriRuntime()).toBe(true);
    expect(isMobileRuntime('Mozilla/5.0 (Linux; Android 15; Pixel 9)')).toBe(true);
  });

  it('derives the browser version label from package metadata', async () => {
    expect(BUILD_VERSION).toBe(packageMetadata.version);
    expect(await getAppVersion()).toBe(`${packageMetadata.version}-web`);
  });
});

describe('mobile document names', () => {
  it('extracts a file name from an Android content URI', () => {
    expect(
      fileNameFromPath(
        'content://com.android.providers.downloads.documents/document/primary%3ADownload%2Fnotes.md',
        'Untitled.md',
      ),
    ).toBe('notes.md');
  });

  it('uses a safe fallback for malformed encoded paths', () => {
    expect(fileNameFromPath('content://provider/%E0%A4%A', 'Draft.md')).toBe('Draft.md');
  });
});
