import { getHeadings, getWordStats } from './document';

export interface DocumentStatistics {
  words: number;
  characters: number;
  lines: number;
  paragraphs: number;
  headings: number;
  links: number;
  listItems: number;
  taskItems: number;
  codeBlocks: number;
  readingMinutes: number;
}

const WORDS_PER_MINUTE = 220;

export function getDocumentStatistics(content: string): DocumentStatistics {
  const base = getWordStats(content);
  const lines = content.split(/\r?\n/);
  let listItems = 0;
  let taskItems = 0;
  let codeBlocks = 0;
  let inFence: { marker: '`' | '~'; length: number } | null = null;

  for (const line of lines) {
    const fence = line.match(/^\s*(`{3,}|~{3,})/);
    if (fence?.[1]) {
      const markerText = fence[1];
      const marker = markerText[0] as '`' | '~';
      if (!inFence) {
        inFence = { marker, length: markerText.length };
        codeBlocks += 1;
      } else if (inFence.marker === marker && markerText.length >= inFence.length) {
        inFence = null;
      }
      continue;
    }

    if (inFence) continue;
    if (/^\s*(?:[-+*]|\d+\.)\s+/.test(line)) listItems += 1;
    if (/^\s*[-+*]\s+\[[ xX]\]\s+/.test(line)) taskItems += 1;
  }

  const paragraphs = content
    .split(/(?:\r?\n){2,}/)
    .map((block) => block.trim())
    .filter((block) => block && !/^\s*(?:```|~~~)/.test(block)).length;

  const links = countMarkdownLinks(content);

  return {
    ...base,
    paragraphs,
    headings: getHeadings(content).length,
    links,
    listItems,
    taskItems,
    codeBlocks,
    readingMinutes: base.words === 0 ? 0 : Math.max(1, Math.ceil(base.words / WORDS_PER_MINUTE)),
  };
}

function countMarkdownLinks(content: string): number {
  let count = 0;
  const pattern = /(?<!!)\[[^\]\n]+\]\([^\n)]+\)/g;
  while (pattern.exec(content)) count += 1;
  return count;
}
