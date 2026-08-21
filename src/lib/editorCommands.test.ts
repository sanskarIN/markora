import { describe, expect, it } from 'vitest';

import { applyMarkdownCommand } from './editorCommands';

describe('applyMarkdownCommand', () => {
  it('wraps a selection in bold markers while preserving the selected body', () => {
    const result = applyMarkdownCommand('hello world', 6, 11, 'bold');

    expect(result.content).toBe('hello **world**');
    expect(result.content.slice(result.selectionStart, result.selectionEnd)).toBe('world');
  });

  it('creates a useful placeholder when formatting an empty selection', () => {
    const result = applyMarkdownCommand('', 0, 0, 'italic');

    expect(result.content).toBe('*italic text*');
    expect(result.content.slice(result.selectionStart, result.selectionEnd)).toBe('italic text');
  });

  it('toggles heading syntax across the selected lines', () => {
    const first = applyMarkdownCommand('Alpha\nBeta', 0, 10, 'heading');
    expect(first.content).toBe('## Alpha\n## Beta');

    const second = applyMarkdownCommand(first.content, 0, first.content.length, 'heading');
    expect(second.content).toBe('Alpha\nBeta');
  });

  it('toggles quote prefixes without changing blank lines', () => {
    const first = applyMarkdownCommand('One\n\nTwo', 0, 8, 'quote');
    expect(first.content).toBe('> One\n\n> Two');

    const second = applyMarkdownCommand(first.content, 0, first.content.length, 'quote');
    expect(second.content).toBe('One\n\nTwo');
  });

  it('renumbers ordered lists deterministically', () => {
    const result = applyMarkdownCommand('Alpha\nBeta\nGamma', 0, 16, 'ordered-list');
    expect(result.content).toBe('1. Alpha\n2. Beta\n3. Gamma');
  });

  it('creates a link and selects the URL placeholder', () => {
    const result = applyMarkdownCommand('Read docs', 5, 9, 'link');

    expect(result.content).toBe('Read [docs](https://)');
    expect(result.content.slice(result.selectionStart, result.selectionEnd)).toBe('https://');
  });

  it('adds and removes fenced code blocks', () => {
    const first = applyMarkdownCommand('const x = 1;', 0, 12, 'code-block');
    expect(first.content).toBe('```\nconst x = 1;\n```');

    const second = applyMarkdownCommand(first.content, 0, first.content.length, 'code-block');
    expect(second.content).toBe('const x = 1;');
  });
});
