# ADR-0003: Validated native file command boundary

**Status:** Accepted

## Context

A Tauri webview should not receive broad arbitrary filesystem permissions merely because Markora is a file editor. Paths selected by users or stored in recent/recovery state may be stale, malformed, unsupported, unexpectedly large, symbolic links, or otherwise unsafe to process blindly.

## Decision

Privileged filesystem and external-link behavior is exposed through explicit Rust/Tauri commands rather than broad frontend filesystem capabilities.

Native commands are responsible for validating the operation before reading/writing/opening:

- supported Markdown/text extensions;
- regular-file status;
- symbolic-link handling;
- file-size limits;
- UTF-8 requirements where content is interpreted as text;
- save/export path behavior;
- approved external URL schemes.

Writes use temporary-file/atomic-replacement behavior where supported by the existing command implementation. The webview keeps only Tauri core defaults and invokes the narrow custom command surface through `src/lib/platform.ts`.

## Consequences

### Benefits

- The frontend does not need unrestricted filesystem access.
- Validation logic is centralized near the privileged operation.
- Browser-development fallbacks remain clearly separated from native behavior.
- Native validation can be covered by Rust tests.

### Tradeoffs

- New filesystem capabilities require a new/extended validated command.
- Browser mode cannot reproduce arbitrary desktop path operations.
- Some convenience features (for example symlink-based workflows) are intentionally restricted unless their safety model is explicitly designed.

## Security requirements

Do not accept a frontend-provided path as proof that an object is safe to read/write. Revalidate at the native boundary. Do not log document contents or unnecessarily expose full paths in structured logs/errors.

## Revisit when

Reconsider only if Tauri capability scoping can provide an equally narrow, auditable, cross-platform boundary for a specific feature without granting broader access than the current custom commands.
