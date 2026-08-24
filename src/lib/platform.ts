import { invoke } from '@tauri-apps/api/core';
import { open as openDialog, save as saveDialog } from '@tauri-apps/plugin-dialog';
import { readTextFile, stat, writeTextFile } from '@tauri-apps/plugin-fs';
import { openUrl } from '@tauri-apps/plugin-opener';

import packageMetadata from '../../package.json';
import type { OpenedFile, SavedFile } from '../types';
import { ensureMarkdownExtension } from './document';
import { normalizeExternalUrl } from './security';

const MAX_MARKDOWN_BYTES = 16 * 1024 * 1024;
const MAX_EXPORT_BYTES = 32 * 1024 * 1024;
const MAX_BACKUP_BYTES = 4 * 1024 * 1024;
const MARKDOWN_EXTENSIONS = ['md', 'markdown', 'mdown', 'mkdn', 'txt'];

export const BUILD_VERSION = packageMetadata.version;

export function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export function isMobileRuntime(userAgent = browserUserAgent()): boolean {
  return isTauriRuntime() && /Android|iPhone|iPad|iPod/i.test(userAgent);
}

export function isDesktopRuntime(): boolean {
  return isTauriRuntime() && !isMobileRuntime();
}

export async function openMarkdownFile(): Promise<OpenedFile | null> {
  if (isMobileRuntime()) {
    const path = await openDialog({
      multiple: false,
      directory: false,
      filters: [{ name: 'Markdown', extensions: MARKDOWN_EXTENSIONS }],
    });
    if (!path) return null;

    await validateMobileFile(path, MAX_MARKDOWN_BYTES);
    const content = await readTextFile(path);
    return { path, name: fileNameFromPath(path, 'Untitled.md'), content };
  }

  if (isDesktopRuntime()) {
    return invoke<OpenedFile | null>('open_markdown_file');
  }

  const file = await chooseBrowserFile('.md,.markdown,.mdown,.mkdn,text/markdown,text/plain');
  if (!file) return null;
  if (file.size > MAX_MARKDOWN_BYTES) throw new Error("The selected file exceeds Markora's safety limit.");
  return { path: null, name: file.name, content: await file.text() };
}

export async function readMarkdownFile(path: string): Promise<OpenedFile> {
  if (isMobileRuntime()) {
    await validateMobileFile(path, MAX_MARKDOWN_BYTES);
    return {
      path,
      name: fileNameFromPath(path, 'Untitled.md'),
      content: await readTextFile(path),
    };
  }
  if (!isDesktopRuntime()) throw new Error('Recent-file reopening requires the installed app.');
  return invoke<OpenedFile>('read_markdown_file', { path });
}

export async function getFileFingerprint(path: string): Promise<string | null> {
  if (!isDesktopRuntime()) return null;
  return invoke<string>('file_fingerprint', { path });
}

export async function saveMarkdownFile(
  path: string | null,
  content: string,
  suggestedName: string,
): Promise<SavedFile | null> {
  if (byteLength(content) > MAX_MARKDOWN_BYTES) {
    throw new Error("The selected file exceeds Markora's safety limit.");
  }

  if (isMobileRuntime()) {
    const name = ensureMarkdownExtension(suggestedName);
    const target =
      path ??
      (await saveDialog({
        defaultPath: name,
        filters: [{ name: 'Markdown', extensions: ['md'] }],
      }));
    if (!target) return null;

    await writeTextFile(target, content);
    return { path: target, name: fileNameFromPath(target, name) };
  }

  if (isDesktopRuntime()) {
    return invoke<SavedFile | null>('save_markdown_file', {
      path,
      content,
      suggestedName: ensureMarkdownExtension(suggestedName),
    });
  }

  const name = ensureMarkdownExtension(suggestedName);
  saveBrowserBlob(new Blob([content], { type: 'text/markdown;charset=utf-8' }), name);
  return { path: null, name };
}

export async function exportHtmlFile(html: string, suggestedName: string): Promise<string | null> {
  if (byteLength(html) > MAX_EXPORT_BYTES) {
    throw new Error("The selected file exceeds Markora's safety limit.");
  }

  const name = `${stripMarkdownExtension(suggestedName)}.html`;
  if (isMobileRuntime()) {
    const target = await saveDialog({
      defaultPath: name,
      filters: [{ name: 'HTML', extensions: ['html', 'htm'] }],
    });
    if (!target) return null;
    await writeTextFile(target, html);
    return target;
  }

  if (isDesktopRuntime()) {
    return invoke<string | null>('export_html_file', { html, suggestedName: name });
  }

  saveBrowserBlob(new Blob([html], { type: 'text/html;charset=utf-8' }), name);
  return name;
}

export async function saveBackupFile(contents: string): Promise<string | null> {
  if (byteLength(contents) > MAX_BACKUP_BYTES) {
    throw new Error("The selected file exceeds Markora's safety limit.");
  }

  const name = `markora-backup-${new Date().toISOString().slice(0, 10)}.json`;
  if (isMobileRuntime()) {
    const target = await saveDialog({
      defaultPath: name,
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });
    if (!target) return null;
    await writeTextFile(target, contents);
    return target;
  }

  if (isDesktopRuntime()) {
    return invoke<string | null>('save_backup_file', { contents, suggestedName: name });
  }
  saveBrowserBlob(new Blob([contents], { type: 'application/json;charset=utf-8' }), name);
  return name;
}

export async function openBackupFile(): Promise<string | null> {
  if (isMobileRuntime()) {
    const path = await openDialog({
      multiple: false,
      directory: false,
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });
    if (!path) return null;
    await validateMobileFile(path, MAX_BACKUP_BYTES);
    return readTextFile(path);
  }

  if (isDesktopRuntime()) return invoke<string | null>('open_backup_file');
  const file = await chooseBrowserFile('.json,application/json');
  if (!file) return null;
  if (file.size > MAX_BACKUP_BYTES) throw new Error("The selected file exceeds Markora's safety limit.");
  return file.text();
}

export async function openExternalUrl(rawUrl: string): Promise<boolean> {
  const url = normalizeExternalUrl(rawUrl);
  if (!url || url.startsWith('#')) return false;

  if (isMobileRuntime()) {
    await openUrl(url);
    return true;
  }

  if (isDesktopRuntime()) {
    await invoke('open_external_url', { url });
    return true;
  }

  const opened = window.open(url, '_blank', 'noopener,noreferrer');
  if (opened) opened.opener = null;
  return opened !== null;
}

export async function getAppVersion(): Promise<string> {
  if (!isTauriRuntime()) return `${BUILD_VERSION}-web`;
  return invoke<string>('app_version');
}

function stripMarkdownExtension(name: string): string {
  return name.replace(/\.(?:md|markdown|mdown|mkdn)$/i, '') || 'document';
}

export function fileNameFromPath(path: string, fallback: string): string {
  try {
    const decoded = decodeURIComponent(path).split(/[?#]/, 1)[0] ?? path;
    const segments = decoded.split(/[\\/]/).filter(Boolean);
    const candidate = segments.at(-1)?.replace(/^primary:/i, '').trim();
    return candidate || fallback;
  } catch {
    return fallback;
  }
}

async function validateMobileFile(path: string, maxBytes: number): Promise<void> {
  const info = await stat(path);
  if (!info.isFile) throw new Error('The selected path is not a regular file.');
  if (info.size > maxBytes) throw new Error("The selected file exceeds Markora's safety limit.");
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function browserUserAgent(): string {
  return typeof navigator === 'undefined' ? '' : navigator.userAgent;
}

function chooseBrowserFile(accept: string): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.style.display = 'none';

    const cleanup = () => input.remove();
    input.addEventListener(
      'change',
      () => {
        const file = input.files?.item(0) ?? null;
        cleanup();
        resolve(file);
      },
      { once: true },
    );

    document.body.append(input);
    input.click();

    window.setTimeout(() => {
      if (document.body.contains(input) && !input.files?.length) {
        cleanup();
        resolve(null);
      }
    }, 60_000);
  });
}

function saveBrowserBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = 'noopener';
  anchor.style.display = 'none';
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
