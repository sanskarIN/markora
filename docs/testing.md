# Markora testing and quality

Markora uses layered verification so pure document behavior, React interaction, native validation, and complete user journeys are checked at the appropriate boundary.

## Frontend quality gate

Run all non-E2E frontend checks:

```bash
npm run quality
```

This runs formatting checks, ESLint, TypeScript type checking, Vitest, and the production Vite build.

Individual commands:

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run test:coverage
npm run build
```

## Unit tests

Vitest tests live next to the modules they cover. Important regression areas include:

- document parsing, headings, breadcrumbs, statistics, and editor commands;
- safe URL handling and sanitized Markdown output;
- local recovery/backup validation and forward-compatible setting defaults;
- find/replace modes and privacy-safe find history;
- layout normalization;
- drag-and-drop validation;
- local font preset safety;
- bounded print stylesheet generation.

When fixing a bug, prefer a focused test that fails for the original defect before adding broad snapshot coverage.

## Component tests

Testing Library exercises rendered behavior such as safe preview links/content. Prefer queries based on accessible roles/names instead of CSS implementation details.

## End-to-end tests

Install Chromium once:

```bash
npx playwright install chromium
```

Run:

```bash
npm run test:e2e
```

The Playwright suite covers browser-compatible core journeys. Native file dialogs and Tauri-specific filesystem behavior require desktop/manual or Rust-level verification.

## Rust verification

Run:

```bash
cargo fmt --manifest-path src-tauri/Cargo.toml --all -- --check
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml --all-features
```

Rust tests should cover path/file validation, size bounds, extension handling, symlink behavior, atomic write helpers, URL scheme validation, and file fingerprinting where applicable.

## Desktop build verification

Generate icons and build a bundle:

```bash
npm run icons
npm run tauri:build
```

A release candidate should be built on Windows, macOS, and Linux. A successful frontend-only build is not enough to claim desktop-platform verification.

## CI matrix

`.github/workflows/ci.yml` contains three stages:

1. Frontend quality on Ubuntu, including Playwright Chromium.
2. Rust formatting, Clippy, and tests on Ubuntu with WebKitGTK dependencies.
3. Desktop bundle builds on Ubuntu, macOS, and Windows after the first two jobs pass.

The repository also includes CodeQL, dependency/security auditing, secret scanning, and Dependabot workflows/configuration.

## Security regression checklist

For changes touching rendering, file access, exports, links, logs, recovery, or drag-and-drop, verify:

- executable Markdown/HTML cannot bypass sanitization;
- unapproved URL schemes remain blocked;
- remote images are not fetched automatically;
- path validation/symlink rules remain enforced;
- file/read limits remain bounded;
- logs do not include Markdown contents, credentials, or unredacted paths;
- recovery migrations reject malformed structures without deleting a valid current session;
- autosave cannot silently overwrite known external changes.

## Accessibility regression checklist

For UI changes verify at minimum:

- keyboard-only operation;
- visible focus state;
- accessible names for icon-only controls;
- Escape behavior for dismissible overlays;
- no information conveyed solely by color;
- reduced-motion behavior;
- readable narrow-window layout.

## Interpreting failures

Do not weaken a safety check to make CI pass. Identify whether the failure is:

- deterministic source/test defect;
- platform prerequisite problem;
- flaky timing/automation issue;
- packaging/signing issue;
- dependency/runtime incompatibility.

Record unresolved environment-specific failures in `what_changed.md` and, when appropriate, a GitHub issue with non-sensitive logs.

## Release evidence

Before publishing a stable release, retain evidence of:

- passing source checks;
- passing Rust checks;
- passing E2E tests;
- successful packages on all supported targets;
- manual smoke testing of open/save/recovery/export;
- keyboard/accessibility smoke testing;
- installation and uninstall checks for produced packages.
