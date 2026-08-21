import { invoke } from '@tauri-apps/api/core';

import type { OpenedFile, SavedFile } from '../types';
import { ensureMarkdownExtension } from './document';
import { normalizeExternalUrl } from './security';

export function isDesktopRuntime(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export async function openMarkdownFile(): Promise<OpenedFile | null> {
  if (isDesktopRuntime()) {
    return invoke<OpenedFile | null>('open_markdown_file');
  }

  const file = await chooseBrowserFile('.md,.markdown,.mdown,.mkdn,text/markdown,text/plain');
  if (!file) return null;
  return { path: null, name: file.name, content: await file.text() };
}

export async function readMarkdownFile(path: string): Promise<OpenedFile> {
  if (!isDesktopRuntime()) throw new Error('Recent-file reopening requires the desktop app.');
  return invoke<OpenedFile>('read_markdown_file', { path });
}

export async function saveMarkdownFile(
  path: string | null,
  content: string,
  suggestedName: string,
): Promise<SavedFile | null> {
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
  const name = `${stripMarkdownExtension(suggestedName)}.html`;
  if (isDesktopRuntime()) {
    return invoke<string | null>('export_html_file', { html, suggestedName: name });
  }

  saveBrowserBlob(new Blob([html], { type: 'text/html;charset=utf-8' }), name);
  return name;
}

export async function saveBackupFile(contents: string): Promise<string | null> {
  const name = `markora-backup-${new Date().toISOString().slice(0, 10)}.json`;
  if (isDesktopRuntime()) {
    return invoke<string | null>('save_backup_file', { contents, suggestedName: name });
  }
  saveBrowserBlob(new Blob([contents], { type: 'application/json;charset=utf-8' }), name);
  return name;
}

export async function openBackupFile(): Promise<string | null> {
  if (isDesktopRuntime()) return invoke<string | null>('open_backup_file');
  const file = await chooseBrowserFile('.json,application/json');
  return file ? file.text() : null;
}

export async function openExternalUrl(rawUrl: string): Promise<boolean> {
  const url = normalizeExternalUrl(rawUrl);
  if (!url || url.startsWith('#')) return false;

  if (isDesktopRuntime()) {
    await invoke('open_external_url', { url });
    return true;
  }

  const opened = window.open(url, '_blank', 'noopener,noreferrer');
  if (opened) opened.opener = null;
  return opened !== null;
}

export async function getAppVersion(): Promise<string> {
  if (!isDesktopRuntime()) return '0.1.0-web';
  return invoke<string>('app_version');
}

function stripMarkdownExtension(name: string): string {
  return name.replace(/\.(?:md|markdown|mdown|mkdn)$/i, '') || 'document';
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
