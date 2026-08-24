# Markora security re-review — 2026-08

Review date: **2026-08-24**

Scope: Markora's frontend rendering/storage boundary, Tauri IPC/capabilities, native file commands, mobile plugin permissions, CSP, release automation, and dependency/security tooling before the stable desktop release milestone.

## Reference baseline

This review was performed against current Tauri 2 guidance, including:

- Security overview: https://v2.tauri.app/security/
- Capabilities: https://v2.tauri.app/security/capabilities/
- Permissions: https://v2.tauri.app/security/permissions/
- Runtime authority: https://v2.tauri.app/security/runtime-authority/
- CSP: https://v2.tauri.app/security/csp/
- Core permissions: https://v2.tauri.app/reference/acl/core-permissions/
- Distribution/signing: https://v2.tauri.app/distribute/

At review time the repository uses the current Tauri 2.11 release family: Rust `tauri` 2.11.5, `@tauri-apps/api` 2.11.1, and `@tauri-apps/cli` 2.11.4.

## Threat model

Markora treats these inputs/boundaries as untrusted:

- Markdown/text document contents;
- document filenames and filesystem paths;
- imported backup JSON;
- links embedded in Markdown;
- HTML export destination/content boundary;
- drag/drop and open-with inputs;
- frontend-to-Rust IPC calls and parameters;
- mobile document-provider URIs;
- persisted local recovery/settings state;
- third-party dependencies, CI actions, and release artifacts.

The primary security objective is to keep document handling local while preventing Markdown or a compromised rendering path from becoming unrestricted operating-system access.

## Findings and changes made during this review

### 1. Application command ACL was implicit — fixed

Tauri application commands registered through `invoke_handler` are allowed by default unless an application command manifest is configured. Markora previously relied on that default.

Changed:

- `src-tauri/build.rs` now declares every frontend-callable application command through `tauri_build::AppManifest`.
- `src-tauri/permissions/markora-commands.toml` explicitly grants separate desktop and mobile command sets.
- `scripts/check-tauri-capabilities.mjs` checks that the build manifest and permission union stay synchronized.

Result: adding a new Rust command no longer silently exposes it through the existing capability configuration.

### 2. Desktop capability also applied to mobile — fixed

`src-tauri/capabilities/default.json` previously lacked a platform restriction. Tauri merges permissions when a window matches multiple capabilities, so the desktop capability also contributed permissions on mobile.

Changed:

- desktop capability is limited to `linux`, `macOS`, and `windows`;
- mobile capability is limited to `android` and `iOS`;
- desktop native document commands are not granted to the mobile capability;
- mobile document I/O remains on picker/scoped plugin APIs.

### 3. `core:default` was broader than required — fixed

Tauri's `core:default` includes app, event, image, menu, path, resource, tray, webview, and window permission groups. Markora does not require that frontend surface.

Changed:

- removed `core:default` from desktop and mobile capabilities;
- granted only `core:event:allow-listen` and `core:event:allow-unlisten` for native lifecycle/drag/drop events;
- frontend `emit` and `emit-to` permissions remain ungranted.

### 4. Capability drift had no regression guard — fixed

The repository now has `npm run security:capabilities`, included in the normal quality gate, hosted CI, and release workflow.

The audit rejects:

- broad `core:default` or `core:event:default` use;
- frontend event emit permissions;
- remote-origin capability access;
- capability/window/platform drift;
- missing mobile plugin permissions required by the platform adapter;
- manifest commands without explicit app permissions;
- permissioned commands that are not in the explicit app manifest.

## Existing controls confirmed

### Markdown rendering

- `react-markdown` renders a structured tree instead of executing arbitrary raw HTML.
- `rehype-sanitize` applies a restricted schema after slug/highlight transforms.
- unsafe URL schemes are rejected by Markora's URL normalizer.
- remote Markdown images are replaced with local text placeholders rather than fetched.
- exported HTML uses the same sanitized Markdown body pipeline and contains self-contained local styles.

### Content Security Policy

The Tauri CSP limits content to local application assets and IPC endpoints. Scripts are restricted to self. Objects, frames, and forms are disabled. Remote image/font/script origins are not enabled.

Inline styles remain allowed because Markora uses bounded dynamic style output for editor/print preferences and React inline layout styles. This is intentionally narrower than allowing inline/evaluated scripts; `script-src` does not grant `unsafe-inline` or `unsafe-eval`.

Any future remote content or HTTP plugin addition requires a new security review rather than merely widening CSP until it works.

### Native desktop file boundary

Rust commands enforce:

- accepted Markdown/text extensions;
- maximum Markdown/export/backup sizes;
- regular-file checks;
- symbolic-link rejection for direct native reads and existing write targets;
- UTF-8 validation;
- temporary-file write/replace behavior;
- safe external URL schemes (`http`, `https`, `mailto`).

Native error messages do not intentionally include private file contents.

### Mobile file boundary

Mobile uses the Tauri dialog, filesystem, opener, and persisted-scope path rather than desktop file-dialog commands. The capability grants only the plugin operations used by the platform adapter: open/save dialog, stat, text read/write, and default URL opening.

Document-provider paths are treated as opaque picker-selected identifiers.

### Frontend error/log boundary

- diagnostic logging redacts path/content-like and secret-like fields;
- unknown native errors are logged internally but surfaced to users through safe localized fallback messages;
- recovery diagnostics are aggregate-only and are covered by tests that reject document titles/paths/content in safe diagnostic fields.

### Local storage and recovery

- workspace snapshots and backups are versioned and validated;
- tab counts and recovery sizes are bounded;
- malformed recovery is rejected instead of trusted;
- recent files are bounded;
- restart/reload recovery has unit and E2E regression coverage.

### Supply chain and automation

The repository has CI, CodeQL, dependency audit, secret scanning, and Dependabot configuration. Release workflow permissions are limited to the release task and releases are draft-first.

Version/tag/capability consistency checks now run before release packaging.

## Residual risks / accepted constraints

### Desktop command path parameters

Desktop custom commands accept a path argument for recent-file reopening, saves, reloads, and fingerprint checks. They validate type/size/symlink/extension boundaries, but the permission layer does not currently parameter-scope these custom paths to a native persisted allowlist.

Impact is reduced by:

- no remote capability origins;
- restrictive CSP;
- sanitized Markdown rendering;
- no raw HTML execution;
- explicit application command ACL;
- file-type/size/symlink validation;
- user-visible workflows supplying paths through native dialogs/recent state.

A future defense-in-depth improvement can move desktop recent-path authorization into a native allowlist/persisted-scope model. It should not be implemented by trusting a frontend-provided "authorized" flag.

This is tracked as hardening rather than a known exploitable blocker under the current rendering/CSP model.

### System webview dependency

Tauri relies on system webviews. Markora cannot patch an OS webview vulnerability itself. Supported systems must receive normal OS/WebView2/WebKitGTK security updates.

### Signing credentials

Source and CI are prepared for credential-separated release processes, but production signing/notarization cannot be verified until project-owned platform credentials are configured. See `docs/signing.md`.

### Manual platform verification

Compilation and browser automation do not replace packaged-app smoke tests or assistive-technology testing. Those remain release gates.

## Dependency review

The Tauri core/runtime and JS API versions used by Markora are on the current 2.11 release line at this review date. Tauri 2.11.1 included IPC/origin security fixes; Markora's Rust `tauri` dependency is newer at 2.11.5.

No dependency should be upgraded solely by editing a version string. Dependency updates must pass frontend/Rust/desktop/mobile checks and security review for changed permissions or behavior.

## Stable-release security gate

Before publishing v1.0.0:

1. `npm run security:capabilities` passes.
2. frontend quality, Rust checks, CodeQL, dependency audit, and secret scan are green on the release commit.
3. Windows/macOS/Linux packaged artifacts build successfully.
4. CSP/capability files match this documented model.
5. sanitized Markdown/link/image regression tests pass.
6. recovery and native file smoke tests pass using non-sensitive fixtures.
7. final release artifacts are inspected for expected permissions/files.
8. signing/notarization status is recorded accurately; unsigned artifacts are not described as signed.
9. no blocker/critical security issue is knowingly open.

## Review outcome

The review identified and fixed two meaningful least-privilege gaps: implicit application-command ACLs and merged/broad core capabilities. With those changes, no blocker was identified in the reviewed source design. Remaining items are release/environment verification and the documented defense-in-depth opportunity for native persisted desktop path authorization.

Re-run this review when Tauri major/minor security architecture changes, Markora adds remote/network content, a new privileged plugin is introduced, or the native file boundary changes materially.

**Made by the Sanskar**
