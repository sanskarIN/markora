import { describe, expect, it } from 'vitest';

import { limitDroppedItems, MAX_DROPPED_FILE_BYTES, readDroppedBrowserFile, validateDroppedFile } from './fileDrop';

describe('file drop helpers', () => {
  it('accepts supported Markdown and text extensions', () => {
    expect(validateDroppedFile('notes.md', 10)).toBeNull();
    expect(validateDroppedFile('README.MARKDOWN', 10)).toBeNull();
    expect(validateDroppedFile('draft.txt', 10)).toBeNull();
  });

  it('rejects unsupported or oversized files', () => {
    expect(validateDroppedFile('archive.zip', 10)).toContain('Markdown');
    expect(validateDroppedFile('huge.md', MAX_DROPPED_FILE_BYTES + 1)).toContain('16 MB');
  });

  it('decodes valid UTF-8 browser drops', async () => {
    const file = new File(['# Hello'], 'hello.md', { type: 'text/markdown' });
    await expect(readDroppedBrowserFile(file)).resolves.toEqual({
      path: null,
      name: 'hello.md',
      content: '# Hello',
    });
  });

  it('rejects invalid UTF-8 browser drops', async () => {
    const file = new File([new Uint8Array([0xff, 0xfe, 0xfd])], 'broken.md');
    await expect(readDroppedBrowserFile(file)).rejects.toThrow('UTF-8');
  });

  it('caps the number of files handled from one drop', () => {
    expect(limitDroppedItems(Array.from({ length: 30 }, (_, index) => index))).toHaveLength(20);
  });
});
