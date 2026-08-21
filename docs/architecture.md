# Architecture

## Overview

Markora is a **modular desktop monolith**. React/TypeScript owns the interactive editing experience while a small Rust/Tauri layer owns privileged desktop operations. The application deliberately avoids a backend service because core editing, preview, recovery, and export are local workflows.

```text
┌──────────────────────────────────────────────────────────────┐
│ React + TypeScript webview                                  │
│                                                              │
│  components/    UI and accessible interaction                │
│  hooks/         workspace orchestration                      │
│  lib/document   pure editor/domain utilities                 │
│  lib/markdown   sanitized preview and HTML export            │
│  lib/storage    versioned local recovery and backup          │
│  lib/security   URL policy and log redaction                 │
│  lib/logging    structured safe diagnostics                  │
│  lib/platform   browser/native adapter boundary              │
└───────────────────────┬──────────────────────────────────────┘
                        │ Tauri invoke only on desktop
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ Rust/Tauri native shell                                     │
│                                                              │
│  open/read Markdown   validate dialog/path/type/size/UTF-8   │
│  save Markdown        validate + temporary-file replacement  │
│  export HTML/backup   validate extension + bounded writes    │
│  external links       allow http/https/mailto only           │
│  app version          package metadata                       │
└──────────────────────────────────────────────────────────────┘
                        │
                        ▼
               Operating system services
```

## Frontend modules

### `src/components/`

Presentation and user interaction. Components receive typed values and callbacks rather than directly owning native privileges.

Key responsibilities:

- toolbar and document tabs;
- outline/recent navigation;
- Markdown source textarea;
- sanitized preview surface;
- find/replace;
- command palette;
- settings/onboarding/status feedback.

### `src/hooks/useWorkspace.ts`

The main application orchestration layer. It coordinates:

- active/open tabs;
- recent files;
- settings;
- local recovery snapshot writes;
- path-backed autosave scheduling;
- platform adapter calls;
- workspace backup/restore;
- toast/status feedback.

The hook does not directly use broad filesystem APIs.

### `src/lib/document.ts`

Pure or mostly pure domain logic:

- document creation/identity;
- dirty-state comparison;
- file-name helpers;
- heading extraction;
- heading breadcrumb calculation;
- cursor-line calculation;
- word statistics;
- deterministic find/replace rules.

These functions are easy to test without a DOM or native shell.

### `src/lib/markdown.tsx`

The shared safe Markdown renderer. Both live preview and HTML export use the same policy so export does not silently become less secure than preview.

Pipeline:

1. `react-markdown` parses Markdown without using `dangerouslySetInnerHTML`.
2. `remark-gfm` adds GitHub-Flavored Markdown constructs.
3. `rehype-slug` creates heading identifiers.
4. `rehype-highlight` adds syntax-highlight token classes.
5. `rehype-sanitize` strips/limits unsafe output and applies a clobber prefix.
6. custom link rendering validates URLs before handing them to the platform adapter.
7. custom image rendering emits a text placeholder instead of performing a remote request.

### `src/lib/storage.ts`

Local recovery is versioned from the first schema (`version: 1`). Restore parsing validates structure, tab count, active ID, settings, recent files, timestamps, and bounded storage size before trusting data.

The recovery snapshot is intentionally separate from normal Markdown files. It is crash/session recovery, not a replacement for user backups.

Workspace backup wraps a validated workspace in a `markora-backup` envelope so arbitrary JSON cannot be mistaken for a backup.

### `src/lib/platform.ts`

An explicit portability boundary:

- desktop runtime → Tauri `invoke` commands;
- browser development preview → browser file input/download fallbacks where safe;
- recent-path reopening → desktop only, because browser pages should not obtain arbitrary stored path access.

The UI should not scatter runtime detection throughout components.

### `src/lib/security.ts` and `logging.ts`

Security helpers centralize approved URL schemes and diagnostic redaction. Logging context keys that resemble content, credentials, cookies, secrets, or paths are redacted before output.

## Native architecture

### Command surface

`src-tauri/src/commands.rs` is the privileged boundary. Current commands are intentionally narrow:

- `open_markdown_file`
- `read_markdown_file`
- `save_markdown_file`
- `export_html_file`
- `save_backup_file`
- `open_backup_file`
- `open_external_url`
- `app_version`

### File-read policy

Reads validate:

- approved extension;
- existing regular file;
- symbolic-link rejection;
- configured maximum size;
- UTF-8 content.

The command returns a user-safe error instead of exposing internal OS error details.

### File-write policy

Writes validate:

- content size;
- approved extension;
- destination shape when already present;
- symbolic-link rejection.

A temporary file in the destination directory is written and synchronized before being persisted to the target. This reduces partial-write risk compared with truncating the final file before all bytes have been written.

### External URL policy

Native opening accepts only parsed `http`, `https`, or `mailto` URLs. It does not expose a general shell-execution command.

## Tauri security configuration

`src-tauri/capabilities/default.json` grants only `core:default`. Markora does not grant generic shell/filesystem plugins to the webview.

`src-tauri/tauri.conf.json` applies a restrictive Content Security Policy. The browser development entry point mirrors this policy in `index.html` while allowing local development websocket traffic.

## State model

The active workspace consists of:

```text
WorkspaceState
  tabs[]
    id
    title
    path|null
    content
    savedContent
    updatedAt
    cursorLine
  activeId
  recentFiles[]
  settings
  onboardingComplete
```

Dirty state is derived by comparing `content` with `savedContent`; it is not an independently mutable flag that could become inconsistent.

## Autosave and recovery

Two complementary mechanisms exist:

1. **Recovery snapshot:** all open tabs are debounced into local webview storage. This can include untitled documents.
2. **File autosave:** only desktop tabs with a real path are written after the configured delay.

An autosave generation counter prevents stale asynchronous completions from marking newer content as saved.

## Export architecture

### HTML

HTML export is rendered from Markdown through the same sanitized React renderer and wrapped in a self-contained local stylesheet. The generated document does not intentionally embed remote fonts or images.

### PDF

PDF uses the system/webview print flow with a dedicated print stylesheet. This keeps the export path inside the already-sanitized rendered document and avoids adding a second HTML interpretation engine.

A future direct-PDF engine must preserve this security property before adoption.

## Error handling

The current architecture separates:

- internal logging context, which is redacted;
- user-visible toast/error messages, which should not expose private paths/content;
- native OS errors, which are mapped to controlled messages.

Future growth should introduce a typed frontend error catalog before duplicating error strings across features.

## Accessibility architecture

Accessibility is treated as component behavior rather than a final skin:

- semantic buttons, tabs, nav, dialogs, status regions;
- native textarea/input/select controls where possible;
- visible `:focus-visible` styling;
- reduced-motion data attribute and CSS overrides;
- responsive breakpoints;
- text status for dirty/autosave/security state.

See `docs/accessibility.md`.

## Internationalization

`src/i18n/en.ts` establishes an external string catalog and translation helper. Some first-pass visible strings still exist directly in components; moving all remaining strings behind catalogs is tracked in `ROADMAP.md` before multi-locale shipping.

## Performance architecture

Markora avoids network calls and database queries in the editing hot path. Markdown parsing currently re-renders on React state updates, which is appropriate for the initial scope. Large-document profiling should precede worker/debounce/virtualization complexity.

See `docs/performance.md`.

## Architecture decision records

Long-lived decisions are recorded in `docs/adr/`:

- ADR 0001 — Tauri + React modular monolith
- ADR 0002 — local-first versioned recovery
- ADR 0003 — shared sanitized Markdown renderer

New ADRs should describe context, decision, consequences, and alternatives rather than only restating code.
