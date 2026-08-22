# ADR-0004: Versioned local recovery and conflict-safe autosave

**Status:** Accepted

## Context

A writing application must recover unsaved work without turning recovery/autosave into a source of silent data loss. A recovered path-backed editor copy may be older or newer than the disk file, especially if the disk file changed while Markora was closed. Likewise, another editor/process may modify a file while Markora is open.

## Decision

Markora uses a versioned local workspace snapshot plus conservative path-backed autosave rules:

- Workspace snapshots use an explicit schema version and bounded serialized size.
- Settings are normalized so newer optional settings can migrate older version-1 snapshots safely.
- Malformed snapshots are ignored rather than trusted.
- Dirty recovered path-backed tabs are marked unverified for disk overwrite purposes.
- Native file fingerprints are remembered after open/save and checked before autosave/manual overwrite.
- Autosave pauses when an external disk change is detected.
- Manual save asks for explicit confirmation before overwriting known external changes or an unverified recovered disk file.
- Users can explicitly reload the active file from disk after deciding the disk version should win.
- Workspace backup/restore uses a versioned Markora JSON envelope.

## Consequences

### Benefits

- Recovery can preserve unsaved writing across restarts.
- Autosave does not silently overwrite known external edits.
- Old snapshots can adopt additive settings without schema churn.
- Backup files can be validated before replacing the current session.

### Tradeoffs

- A recovered path-backed file may require one explicit reconciliation/save before autosave resumes.
- Fingerprints are conflict signals, not a full multi-version merge system.
- Markora does not automatically merge two independently edited Markdown copies.

## Privacy and logging

Recovery data remains local. Diagnostics should report state/reason codes rather than document contents. Paths/content must remain redacted where logging is involved.

## Revisit when

A future compare/merge UI may extend this decision, but it must preserve the rule that Markora never resolves ambiguous concurrent edits by silently discarding one side.
