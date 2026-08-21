import type { OpenedFile } from '../types';

export const MAX_DROPPED_FILE_BYTES = 16 * 1024 * 1024;
export const MAX_DROPPED_FILES = 20;
const MARKDOWN_EXTENSIONS = new Set(['md', 'markdown', 'mdown', 'mkdn', 'txt']);

export function validateDroppedFile(name: string, size: number): string | null {
  const normalizedSize = Number.isFinite(size) ? size : Number.POSITIVE_INFINITY;
  if (normalizedSize < 0 || normalizedSize > MAX_DROPPED_FILE_BYTES) {
    return 'The dropped file exceeds Markora’s 16 MB safety limit.';
  }

  const extension = name.split('.').at(-1)?.toLocaleLowerCase() ?? '';
  if (!MARKDOWN_EXTENSIONS.has(extension)) {
    return 'Only Markdown and plain-text files can be dropped into Markora.';
  }

  return null;
}

export async function readDroppedBrowserFile(file: File): Promise<OpenedFile> {
  const error = validateDroppedFile(file.name, file.size);
  if (error) throw new Error(error);

  const bytes = await file.arrayBuffer();
  let content: string;
  try {
    content = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new Error('The dropped file is not valid UTF-8 text.');
  }

  return { path: null, name: file.name, content };
}

export function limitDroppedItems<T>(items: T[]): T[] {
  return items.slice(0, MAX_DROPPED_FILES);
}
