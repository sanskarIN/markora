import { describe, expect, it } from 'vitest';

import { createDocument } from './document';
import { getRecoveryDiagnostics, toSafeRecoveryLogFields } from './recoveryDiagnostics';

describe('recovery diagnostics', () => {
  it('reports bounded aggregate state without exposing document identity', () => {
    const first = createDocument('private words', 'Secret.md', '/private/Secret.md');
    const second = createDocument('draft', 'Draft.md');
    second.content = 'draft changed';
    first.updatedAt = 1_000;
    second.updatedAt = 1_500;

    const diagnostics = getRecoveryDiagnostics([first, second], 2_000);
    expect(diagnostics).toMatchObject({
      openDocuments: 2,
      dirtyDocuments: 1,
      diskLinkedDocuments: 1,
      recoveryOnlyDocuments: 1,
      oldestUpdateAgeMs: 1_000,
    });

    const safeFields = toSafeRecoveryLogFields(diagnostics);
    const raw = JSON.stringify(safeFields);
    expect(raw).not.toContain('private words');
    expect(raw).not.toContain('Secret.md');
    expect(raw).not.toContain('/private/');
  });

  it('handles an empty workspace diagnostic input', () => {
    expect(getRecoveryDiagnostics([], 10_000)).toEqual({
      openDocuments: 0,
      dirtyDocuments: 0,
      diskLinkedDocuments: 0,
      recoveryOnlyDocuments: 0,
      totalContentBytes: 0,
      largestDocumentBytes: 0,
      oldestUpdateAgeMs: 0,
    });
  });
});
