# Changelog

All notable Markora changes are documented here. Markora uses semantic-version-style development versions; stable compatibility guarantees begin with the verified v1.0 desktop release.

## [Unreleased]

### Verification pending for stable v1.0

- Hosted cross-platform release-candidate workflow evidence must be confirmed on the final candidate commit.
- Windows, macOS, and Linux packaged artifacts must be installed, launched, smoke-tested, and uninstalled.
- Manual packaged-build screen-reader results must be recorded.
- Native packaged startup/package-size measurements must be recorded.
- Release-build screenshots must replace illustrative artwork where required for stable launch.
- Actual signing/notarization status must be recorded per artifact; strategy documentation alone is not treated as completed signing.

## [0.5.0] - Unreleased

### Added

- Persistent English/Hindi interface locale architecture with typed translation catalogs and parity tests.
- Locale-aware toolbar, tabs, editor/preview, command palette, search, navigation/statistics, onboarding, settings, recovery, presets, keyboard shortcuts, notifications, confirmations, file-drop summaries, and HTML export metadata.
- Locale-safe presentation boundary for native/file/backup errors so unknown internal failures are logged without being exposed directly to the user.
- Bidirectional and complex-script fixtures covering Devanagari, Arabic, Hebrew, combining marks, emoji, code, and tables.
- Forced-colors/high-contrast stylesheet and Playwright regression coverage.
- Automated accessibility checks for accessible control names, duplicate IDs, keyboard order, dialog Escape behavior, and forced-colors focus visibility.
- Manual screen-reader verification matrix for Windows, macOS, and Linux in `docs/accessibility.md`.
- Abrupt-style recovery unit/E2E coverage proving unsaved content and active workspace state survive restart/webview replacement.
- Conservative automated performance budgets for startup, medium-document preview, 1,200-heading outline filtering, and production web-bundle size.
- `scripts/check-version-sync.mjs` to prevent npm/Tauri/Cargo version drift.
- `scripts/check-release-tag.mjs` to prevent release tag/package-version mismatch.
- `scripts/check-web-bundle-size.mjs` to enforce the production frontend size budget.
- Explicit Tauri application-command manifest and platform-specific application-command permissions.
- `scripts/check-tauri-capabilities.mjs` to prevent broad or drifting Tauri capability permissions.
- Stable desktop compatibility/support policy, install/uninstall verification guide, signing/notarization strategy, and August 2026 security re-review.

### Changed

- Development/package version prepared as **0.5.0** across `package.json`, `src-tauri/tauri.conf.json`, and `src-tauri/Cargo.toml`.
- Runtime/About version labels now derive from synchronized package metadata instead of hard-coded `0.1.0` fallbacks.
- Native desktop and mobile file pickers no longer inject English dialog titles; picker chrome is left to the operating system locale.
- HTML exports now carry locale-aware language metadata and bidi-friendly direction behavior.
- Live editor/preview handling uses direction-safe behavior for mixed-script documents.
- CI now runs version synchronization, Tauri capability auditing, production bundle budget checks, accessibility/i18n/recovery/performance E2E coverage, Rust quality checks, and cross-platform desktop packaging.
- Release workflow now rejects version/tag drift and capability regressions before packaging a draft release.
- Release policy now uses v0.5.x as the release-candidate line and explicitly reserves v1.0.0 for verified stable desktop artifacts.

### Security

- Replaced implicit default access to custom Tauri application commands with an explicit `AppManifest` command list.
- Split desktop/mobile application-command permissions so desktop file commands are not merged into mobile capabilities.
- Restricted the desktop capability to Linux/macOS/Windows and the mobile capability to Android/iOS.
- Removed broad `core:default` and `core:event:default` grants.
- Frontend core event authority is limited to listen/unlisten; event emit/emit-to permissions are intentionally absent.
- Capability audit rejects remote-origin IPC grants, broad core permissions, unexpected app commands, missing platform scope, and permission drift.
- Current Tauri security model was re-reviewed against the active Tauri 2 architecture; no source-level blocker was identified after the least-privilege fixes.
- Remaining defense-in-depth item is documented: desktop custom command path parameters are validated but not yet backed by a native persisted path-authorization allowlist.

### Performance

- Production `dist/` has a 3 MiB regression ceiling.
- Browser regression thresholds are intentionally conservative shared-runner tripwires, not universal hardware SLAs.
- Stable publication still requires packaged startup/package-size measurements on each desktop target.

### Accessibility

- English/Hindi locale switching and mixed-script handling are covered in browser automation.
- High-contrast/forced-colors behavior is implemented and regression-tested.
- Manual assistive-technology verification remains a packaged-release gate and is not falsely marked as completed by browser automation.

## [0.1.0] - Preview baseline

The original implementation baseline established the local-first React/TypeScript + Rust/Tauri Markdown editor, sanitized GFM preview, tabs, recovery/autosave, recent files, outline/breadcrumbs, find/replace, export/print flow, themes, command palette, native validated file operations, documentation, tests, and GitHub automation.

This baseline was a development target rather than the final stable compatibility promise.

[Unreleased]: https://github.com/sanskarIN/markora/compare/v0.5.0...HEAD
[0.5.0]: https://github.com/sanskarIN/markora/releases/tag/v0.5.0
[0.1.0]: https://github.com/sanskarIN/markora/releases/tag/v0.1.0
