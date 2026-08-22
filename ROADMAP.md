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
- [ ] Confirm clean hosted CI across Windows, macOS, and Linux and fix any environment-specific defects discovered by the first run.
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

- [ ] Move all remaining visible strings through the i18n catalog.
- [ ] Add locale loading architecture and first translated language pack based on contributor demand.
- [ ] Automated accessibility regression checks where reliable.
- [ ] Screen-reader/manual test matrix for primary desktop platforms.
- [ ] High-contrast theme audit and platform forced-colors support.
- [ ] Bidirectional-text and complex-script editing/preview test fixtures.

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
