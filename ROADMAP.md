# Markora Roadmap

This roadmap prioritizes coherent improvements to the Markdown writing experience. Dates are intentionally not promised here; quality gates determine when work is ready.

## Guiding principles

1. **Local-first by default** — core writing must work without an account or cloud service.
2. **Safe content handling** — Markdown, paths, backups, links, and exports are untrusted inputs.
3. **Fast writing workflow** — keyboard use, recovery, navigation, and rendering should feel immediate.
4. **Accessible product quality** — features are incomplete if they are not keyboard reachable and understandable with assistive technology.
5. **Maintainable scope** — avoid unrelated feature accumulation and unnecessary services.
6. **Evidence-based optimization** — benchmark before changing architecture for performance.

## v0.1 — Production-quality preview

### Product

- [x] Markdown source editor.
- [x] Live sanitized GFM preview.
- [x] Fenced-code syntax highlighting.
- [x] Outline navigation and heading breadcrumbs.
- [x] Find and replace.
- [x] Word/character/line status.
- [x] Multiple tabs and recent files.
- [x] Local recovery and path-backed autosave.
- [x] HTML export.
- [x] Print/PDF workflow.
- [x] Themes and distraction-free mode.
- [x] Keyboard shortcuts and command palette.
- [x] Settings, onboarding, About, support/funding links.
- [x] Workspace backup/restore.

### Engineering

- [x] Rust/Tauri validated file boundary.
- [x] CSP and narrow capabilities.
- [x] Structured redacted logging.
- [x] Unit/component/E2E/Rust test baseline.
- [x] Cross-platform CI and release workflows.
- [x] CodeQL, dependency audit, secret scan, Dependabot.
- [x] Documentation and ADR baseline.
- [ ] Confirm clean hosted CI across Windows, macOS, and Linux and fix any environment-specific defects discovered by the current release-candidate run.
- [ ] Replace illustrative README preview with release-build screenshots after successful packaged-app verification.

## v0.2 — Editing depth

Implemented scope:

- [x] Undo-safe structural Markdown commands for headings, lists, quotes, code fences, links, and emphasis.
- [x] Split/editor-only/preview-only layout presets with persisted pane ratios.
- [x] Large-document heading virtualization and outline search.
- [x] Find history plus whole-word and regex modes with explicit safe UX.
- [x] Document statistics panel with reading time and heading/list/code counts.
- [x] Session restore controls and per-tab recovery inspection.
- [x] Local file-change fingerprinting with conflict-safe autosave/save guards and explicit disk reload UX.
- [x] Drag-and-drop open for validated Markdown files.
- [x] User-selectable local/system font presets without remote font loading.

## v0.3 — Export and workflow polish

- [x] Dedicated print/export settings for page size, margins, heading page-break behavior, code wrapping, and print metadata.
- [x] PDF reproducibility investigation documented: platform print engines are retained for safety/portability, so cross-platform byte-identical PDFs are not claimed.
- [x] Self-contained HTML export with inline local styles only and no automatic remote image requests.
- [x] Versioned, validated export templates with built-in Standard/Compact/Code Review/Letter presets.
- [x] Named local workspace/session presets for normalized settings and layout only; document contents are excluded.
- [x] Command-palette discoverability plus local configurable Ctrl/Command shortcut mapping with duplicate detection and reset-to-defaults.
- [x] Aggregate recovery diagnostics with tests proving safe log fields exclude document content, titles, and paths.

## v0.4 — Internationalization and accessibility expansion

- [x] Move application-visible UI strings through the i18n catalog or defer native picker chrome to the operating system locale.
- [x] Add locale loading architecture and the first translated language pack (Hindi) with persistent language selection.
- [x] Add automated accessibility regression checks where reliable.
- [x] Define the screen-reader/manual test matrix for primary desktop platforms.
- [x] Add high-contrast/forced-colors support and automated regression coverage.
- [x] Add bidirectional-text and complex-script editing/preview fixtures.

## v0.5 — Stable-release candidate hardening

The repository metadata is prepared for **v0.5.0**. This milestone is intentionally the release-candidate line before stable v1.0 rather than a claim that manual platform verification has already happened.

### Completed in source

- [x] Synchronize npm, Cargo, and Tauri version metadata with an automated drift guard.
- [x] Reject release tags that do not match package version metadata.
- [x] Add conservative automated startup, preview, large-outline, and production bundle-size regression budgets.
- [x] Add restart/webview-replacement recovery tests for unsaved local content.
- [x] Document stable desktop compatibility/support policy and separate Android release readiness.
- [x] Document Windows/macOS/Linux install, upgrade, and uninstall verification procedures.
- [x] Document signing/notarization credential boundaries and verification strategy.
- [x] Re-review the current Tauri security model against current Tauri 2 guidance.
- [x] Replace implicit Tauri application-command access with an explicit `AppManifest` and platform-specific permissions.
- [x] Remove broad `core:default`/event emit permissions and add a capability-regression audit to quality/CI/release workflows.
- [x] Derive runtime/About version labels from synchronized package metadata.

### Release-candidate evidence still required

- [ ] Confirm the latest hosted frontend, Rust, Android (where applicable), and Windows/macOS/Linux desktop build workflows are clean.
- [ ] Install, launch, smoke-test, upgrade where applicable, and uninstall the produced Windows artifact.
- [ ] Install, launch, smoke-test, upgrade where applicable, and uninstall the produced macOS artifact.
- [ ] Install, launch, smoke-test, upgrade where applicable, and uninstall the produced Linux artifact/package form(s) being published.
- [ ] Record packaged startup and package-size measurements for each stable desktop target.
- [ ] Complete and record the manual screen-reader rows in `docs/accessibility.md` on real packaged builds.
- [ ] Capture privacy-safe screenshots from verified packaged release builds and replace the illustrative README preview when appropriate.
- [ ] Record actual signing/notarization status for every published artifact; configure real credentials only through protected release secrets when available.

## v1.0 — Stable desktop release

Stability criteria include:

- clean reproducible builds on supported platforms;
- no known blocker/critical defects;
- recovery/autosave behavior validated against abrupt termination scenarios;
- documented compatibility and support policy;
- signed/notarized distribution strategy documented where platform credentials permit;
- release screenshots and install/uninstall docs verified;
- core journeys covered by stable automation and manual accessibility review;
- performance budgets measured on representative large Markdown files;
- security model re-reviewed with current dependencies and Tauri guidance.

The source/documentation portions of these criteria are now largely implemented in v0.5.0. **v1.0.0 must not be declared stable until the remaining packaged/manual evidence in the v0.5 section is completed and recorded.**

## Ideas not currently planned

These are intentionally excluded unless a strong product case appears:

- mandatory accounts or sign-in;
- advertising or tracking SDKs;
- intrusive donation prompts;
- automatic document upload/sync;
- collaborative cloud editing infrastructure;
- plugin execution that bypasses the sanitizer/native permission boundary;
- full word-processor features unrelated to Markdown workflows.

## How priorities change

Roadmap order may change for:

- security fixes;
- data-loss/recovery defects;
- accessibility blockers;
- platform breakages;
- dependency/runtime deprecations;
- measured performance regressions.

Use the GitHub feature-request template to propose changes. A proposal should explain the user problem, privacy/security impact, accessibility considerations, and maintainability cost.

**Made by the Sanskar**
