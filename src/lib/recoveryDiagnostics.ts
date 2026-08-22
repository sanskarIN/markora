import { isDirty } from './document';
import type { DocumentTab } from '../types';

export interface RecoveryDiagnostics {
  openDocuments: number;
  dirtyDocuments: number;
  diskLinkedDocuments: number;
  recoveryOnlyDocuments: number;
  totalContentBytes: number;
  largestDocumentBytes: number;
  oldestUpdateAgeMs: number;
}

export function getRecoveryDiagnostics(tabs: DocumentTab[], now = Date.now()): RecoveryDiagnostics {
  let dirtyDocuments = 0;
  let diskLinkedDocuments = 0;
  let totalContentBytes = 0;
  let largestDocumentBytes = 0;
  let oldestUpdatedAt = now;

  for (const tab of tabs) {
    if (isDirty(tab)) dirtyDocuments += 1;
    if (tab.path) diskLinkedDocuments += 1;
    const bytes = new Blob([tab.content]).size;
    totalContentBytes += bytes;
    largestDocumentBytes = Math.max(largestDocumentBytes, bytes);
    oldestUpdatedAt = Math.min(oldestUpdatedAt, tab.updatedAt);
  }

  return {
    openDocuments: tabs.length,
    dirtyDocuments,
    diskLinkedDocuments,
    recoveryOnlyDocuments: tabs.length - diskLinkedDocuments,
    totalContentBytes,
    largestDocumentBytes,
    oldestUpdateAgeMs: tabs.length ? Math.max(0, now - oldestUpdatedAt) : 0,
  };
}

export function toSafeRecoveryLogFields(diagnostics: RecoveryDiagnostics): Record<string, number> {
  return {
    openDocuments: diagnostics.openDocuments,
    dirtyDocuments: diagnostics.dirtyDocuments,
    diskLinkedDocuments: diagnostics.diskLinkedDocuments,
    recoveryOnlyDocuments: diagnostics.recoveryOnlyDocuments,
    totalContentBytes: diagnostics.totalContentBytes,
    largestDocumentBytes: diagnostics.largestDocumentBytes,
    oldestUpdateAgeMs: diagnostics.oldestUpdateAgeMs,
  };
}
