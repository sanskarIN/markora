# Changelog

All notable Markora changes are documented here. The project follows a Keep-a-Changelog-style structure and intends to use semantic versioning once release compatibility guarantees stabilize.

## [Unreleased]

### Added

- Local-first Markdown editing workspace built with React, TypeScript, Rust, and Tauri.
- Sanitized GFM-compatible live preview with fenced-code syntax highlighting.
- Multiple document tabs, recent-file reopening, heading outline, heading breadcrumbs, find/replace, cursor status, word count, and character count.
- Path-backed desktop autosave plus versioned local recovery snapshots.
- Explicit JSON workspace backup and restore.
- Safe HTML export and print/PDF workflow.
- Command palette and keyboard shortcuts for core actions.
- Light/dark/system appearance and Graphite/Aurora/Paper editor themes.
- Distraction-free writing mode and typography controls.
- Onboarding plus settings sections for appearance, privacy/data, accessibility, updates, and About.
- Required project identity, support contacts, GitHub link, Buy Me a Coffee link, and **Made by the Sanskar** credit.
- Native Rust commands for validated Markdown open/read/save, backup, HTML export, approved external links, and app version retrieval.
- File-size boundaries, extension checks, symlink rejection, UTF-8 validation, atomic native write strategy, CSP, URL scheme allow-listing, remote preview-image blocking, and structured log redaction.
- Unit tests for document utilities, storage validation, security rules, sanitized export behavior, and Rust file helpers.
- Component tests for safe preview behavior and browser E2E tests for editing, find/replace, command palette, and settings identity/privacy/accessibility surfaces.
- Cross-platform CI, CodeQL, dependency audits, secret scanning, Dependabot, and draft release packaging.
- Complete project documentation baseline and architecture decision records.

### Changed

- Repository expanded from the initial MIT license into the Markora application and engineering/documentation baseline.

### Security

- Unsafe Markdown link schemes are blocked in both frontend and native URL handling.
- Markdown preview does not automatically request remote images.
- Webview capabilities are restricted to Tauri core defaults; filesystem actions use validated custom commands.
- Browser-development and Tauri production contexts use restrictive Content Security Policy rules.

### Known verification notes

- The execution environment used for the initial repository build did not provide Cargo/Rust and could not access external package registries, so full local `npm`/Cargo verification could not be completed there. GitHub Actions is configured to perform those checks on hosted runners; `what_changed.md` records exact verification state and follow-up results.

## [0.1.0] - Unreleased

Initial production-quality preview target. This version will be dated when a verified release tag is published.

[Unreleased]: https://github.com/sanskarIN/markora/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/sanskarIN/markora/releases/tag/v0.1.0
