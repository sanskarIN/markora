# Markora testing and quality

Markora uses layered verification so pure document behavior, React interaction, native validation, security boundaries, performance budgets, and complete user journeys are checked at the appropriate boundary.

## Frontend/repository quality gate

Run the normal non-E2E repository gate:

```bash
npm run quality
```

This now checks:

1. synchronized npm/Tauri/Cargo version metadata;
2. least-privilege Tauri capability/app-command configuration;
3. Prettier formatting;
4. ESLint;
5. TypeScript type checking;
6. Vitest unit/component tests;
7. the production Vite build;
8. the production `dist/` size regression budget.

Individual commands:

```bash
npm run version:check
npm run security:capabilities
npm run format:check
npm run lint
npm run typecheck
npm test
npm run test:coverage
npm run build
npm run size:check
```

Release tags additionally use:

```bash
npm run release:check
```

`release:check` requires the tag name to equal `v` plus the synchronized package version.

## Unit tests

Vitest tests live next to the modules they cover. Important regression areas include:

- document parsing, headings, breadcrumbs, statistics, and editor commands;
- safe URL handling and sanitized Markdown output;
- local recovery/backup validation and forward-compatible setting defaults;
- abrupt-style recovery state and active-tab restoration;
- find/replace modes and privacy-safe find history;
- layout normalization;
- drag-and-drop validation;
- local font preset safety;
- bounded print stylesheet generation;
- i18n catalog parity and safe translated errors;
- runtime/version metadata behavior.

When fixing a bug, prefer a focused test that fails for the original defect before adding broad snapshot coverage.

## Component tests

Testing Library exercises rendered behavior such as safe preview links/content. Prefer queries based on accessible roles/names instead of CSS implementation details.

Locale-aware components should be rendered through the shared i18n test helper so tests exercise the same provider boundary as the application.

## End-to-end tests

Install Chromium once:

```bash
npx playwright install chromium
```

Run the complete browser suite:

```bash
npm run test:e2e
```

The Playwright suite covers browser-compatible core journeys, including:

- editing and sanitized preview;
- structural formatting commands;
- find/replace and bounded regex behavior;
- dropped-file handling;
- persistent layout settings;
- command palette/settings flows;
- accessibility naming, duplicate-ID, keyboard, dialog, and forced-colors checks;
- locale switching/persistence and complex-script/bidi fixtures;
- recovery after abrupt-style reload/webview replacement;
- conservative startup/preview/large-outline performance budgets.

Run only the performance regression checks with:

```bash
npm run test:e2e -- e2e/performance.spec.ts
```

Native file dialogs and Tauri-specific filesystem behavior require desktop/manual or Rust-level verification.

## Performance budgets

Current automated regression budgets are documented in `docs/performance.md`. They intentionally use conservative CI thresholds rather than pretending shared-runner timings are a universal hardware SLA.

The production frontend bundle is also capped by `npm run size:check`. A failed budget should be investigated before increasing a threshold.

## Tauri capability security audit

Run:

```bash
npm run security:capabilities
```

The audit checks that:

- desktop and mobile capabilities are platform-scoped;
- no remote-origin IPC capability is configured;
- broad `core:default` and `core:event:default` permissions are absent;
- only frontend event listen/unlisten permissions are granted;
- desktop and mobile application-command sets are explicit;
- command permissions match the `AppManifest` command declaration;
- the mobile plugin permissions required by the platform adapter remain present.

This is a configuration regression test, not a substitute for reviewing the behavior of privileged Rust/plugin code.

## Rust verification

Run:

```bash
cargo fmt --manifest-path src-tauri/Cargo.toml --all -- --check
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml --all-features
```

Rust tests should cover path/file validation, size bounds, extension handling, symlink behavior, atomic write helpers, URL scheme validation, and file fingerprinting where applicable.

Changes to `src-tauri/build.rs`, `src-tauri/permissions/`, or `src-tauri/capabilities/` must pass both Rust/Tauri compilation and `npm run security:capabilities`.

## Desktop build verification

Generate icons and build a bundle:

```bash
npm run icons
npm run tauri:build
```

A release candidate should be built on Windows, macOS, and Linux. A successful frontend-only build is not enough to claim desktop-platform verification.

Installation/removal verification is documented in `docs/install-uninstall.md`.

## Android verification

Android has its own CI/build path and manual release checklist in `docs/android.md`. Android buildability is valuable project coverage but does not substitute for the v1.0 stable desktop release gate.

## CI matrix

`.github/workflows/ci.yml` contains three stages:

1. Frontend/repository quality on Ubuntu, including version/capability/bundle checks and Playwright Chromium.
2. Rust formatting, Clippy, and tests on Ubuntu with WebKitGTK dependencies.
3. Desktop bundle builds on Ubuntu, macOS, and Windows after the first two jobs pass.

The repository also includes CodeQL, dependency/security auditing, secret scanning, Dependabot, Android verification, and draft release packaging workflows/configuration.

## Security regression checklist

For changes touching rendering, file access, exports, links, logs, recovery, IPC, capabilities, or drag-and-drop, verify:

- executable Markdown/HTML cannot bypass sanitization;
- unapproved URL schemes remain blocked;
- remote images are not fetched automatically;
- path validation/symlink rules remain enforced;
- file/read limits remain bounded;
- logs do not include Markdown contents, credentials, or unredacted paths;
- recovery migrations reject malformed structures without deleting a valid current session;
- autosave cannot silently overwrite known external changes;
- new Tauri commands are not implicitly exposed and have the minimum platform-specific permission set;
- capability changes do not grant remote origins or unused broad core/plugin permissions.

See `docs/security-review-2026-08.md` for the current pre-stable review.

## Accessibility regression checklist

For UI changes verify at minimum:

- keyboard-only operation;
- visible focus state;
- accessible names for icon-only controls;
- Escape behavior for dismissible overlays;
- no information conveyed solely by color;
- reduced-motion behavior;
- forced-colors/high-contrast behavior;
- readable narrow-window layout;
- mixed-script/bidirectional content does not break editor/preview structure.

The manual assistive-technology matrix is maintained in `docs/accessibility.md`.

## Interpreting failures

Do not weaken a safety check to make CI pass. Identify whether the failure is:

- deterministic source/test defect;
- platform prerequisite problem;
- flaky timing/automation issue;
- packaging/signing issue;
- dependency/runtime incompatibility;
- intentional security-boundary rejection that exposed an incorrect test assumption.

Record unresolved environment-specific failures in `what_changed.md` and, when appropriate, a GitHub issue with non-sensitive logs.

## Release evidence

Before publishing a stable release, retain evidence of:

- passing version/capability/format/lint/type/unit/build/bundle checks;
- passing Rust checks;
- passing E2E and performance-regression tests;
- successful packages on all supported desktop targets;
- manual smoke testing of open/save/recovery/export;
- keyboard/accessibility and screen-reader smoke testing;
- installation and uninstall checks for produced packages;
- final artifact signing/notarization status recorded accurately;
- no known blocker/critical defect.

CI compilation is necessary evidence, but it is not proof that an installed artifact works correctly on every supported platform.
