# Markora release guide

Markora releases should be treated as verification events, not only packaging events. The release workflow builds a draft GitHub Release from tags matching `v*` on Ubuntu, macOS, and Windows.

## Release milestone policy

The current development/release-candidate line is **v0.5.x**. It contains the completed v0.4 internationalization/accessibility work plus stable-release hardening.

**v1.0.0 is reserved for the first stable desktop release that has actual packaged Windows/macOS/Linux runtime verification.** A successful source build or CI package build alone must not be used to claim v1.0 readiness.

Android remains a separately verified project target; see `docs/android.md`.

## Before tagging

Confirm the working branch is clean and review `CHANGELOG.md`, `ROADMAP.md`, and `what_changed.md`.

Run the repository quality gate:

```bash
npm install
npm run quality
npx playwright install chromium
npm run test:e2e
```

The quality gate includes version synchronization, Tauri capability auditing, formatting, lint, type checking, unit/component tests, production build, and the production web-bundle budget.

Run Rust checks:

```bash
cargo fmt --manifest-path src-tauri/Cargo.toml --all -- --check
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml --all-features
```

Build a local desktop bundle on at least the release operator's platform:

```bash
npm run icons
npm run tauri:build
```

Review the current security model in `docs/security-review-2026-08.md` and ensure the capability audit still describes the checked-in permissions.

## Version synchronization

Before a release, keep package versions synchronized across:

- `package.json`;
- `src-tauri/tauri.conf.json`;
- `src-tauri/Cargo.toml`;
- `CHANGELOG.md`;
- README/release notes that state a concrete development version.

Verify the three executable/package metadata sources with:

```bash
npm run version:check
```

Do not publish a tag whose package metadata identifies a different release.

## Tagging

Use an annotated or signed tag when the release process supports it. For the prepared v0.5.0 candidate:

```bash
git tag -a v0.5.0 -m "Markora v0.5.0"
git push origin v0.5.0
```

Before packaging, `.github/workflows/release.yml` verifies that `GITHUB_REF_NAME` equals `v` plus the synchronized package version through:

```bash
npm run release:check
```

A mistyped or stale tag must fail instead of packaging the wrong version.

## What the release workflow does

For Ubuntu, macOS, and Windows the workflow:

1. checks out the tagged commit;
2. installs Node.js and stable Rust;
3. installs Linux WebKitGTK/Tauri dependencies where required;
4. installs frontend dependencies;
5. verifies synchronized package metadata;
6. audits Tauri capability/application-command boundaries;
7. verifies the tag matches the package version;
8. generates platform icons;
9. runs the Tauri packaging action;
10. creates/updates a **draft** GitHub Release named for the package version.

Draft status is intentional. Do not publish the release merely because artifacts exist.

## Draft release verification

For each produced desktop artifact:

- confirm filename/version/architecture are expected;
- follow `docs/install-uninstall.md` for installation and removal verification;
- launch Markora from the installed package;
- create/edit a Markdown document;
- open and save a path-backed file;
- verify autosave and external-change protection;
- restart and verify recovery/session behavior;
- test sanitized preview and an external HTTPS link;
- export self-contained HTML;
- exercise print/PDF with default and one non-default print configuration;
- test keyboard shortcuts, command palette, settings, and recovery controls;
- inspect About/version text;
- exercise the relevant manual screen-reader/accessibility row in `docs/accessibility.md`;
- uninstall using the platform's normal process and confirm user-created documents remain.

Do not use real sensitive documents for release smoke testing.

## Performance verification

Automated performance and bundle regression budgets are defined in `docs/performance.md` and run through Playwright/`npm run size:check`.

For a stable release candidate, also record actual packaged-app startup and package size on each target OS. CI browser timing is a regression signal, not a substitute for native startup measurement.

## Signing and notarization

The credential and verification boundary is documented in `docs/signing.md`.

The repository can build unsigned draft artifacts without private platform credentials. Public production distribution should use appropriate signing/notarization when project-owned credentials are available:

- Windows Authenticode/code-signing identity or approved managed signing service;
- Apple Developer ID signing and notarization for normal direct-download macOS distribution;
- distribution-appropriate Linux checksum/signing path;
- Android signing separately for production APK/AAB distribution.

Never commit signing secrets, certificates, private keys, tokens, keystores, or notarization passwords.

If a release is unsigned, describe it as unsigned. Do not imply signing/notarization has been completed merely because the strategy is documented.

## Compatibility and support

The stable support target and version policy are defined in `docs/support-policy.md`. Platform verification is artifact-specific: CI compilation alone does not convert every theoretically supported OS/architecture into a verified release target.

## Reproducibility expectations

Markora's HTML export is self-contained and local-only. Print-to-PDF is intentionally delegated to the platform print engine, so byte-for-byte identical PDFs across operating systems/printer engines are not guaranteed.

For PDF verification, compare semantic/rendered output rather than file hashes across different platforms. Record OS, webview, paper size, margins, code-wrap setting, and metadata setting used for a release smoke test.

## Release screenshots

The README currently uses editable illustrative artwork. Replace it with screenshots captured from a verified packaged release only after:

- the release candidate launches successfully on supported desktop targets;
- visible version/theme state is intentional;
- no private filenames/content appear in the capture;
- the screenshot matches the shipped interface.

Do not manufacture a screenshot from the development illustration and label it as a release-build capture.

## Stable v1.0 gate

Do not advance from the v0.5.x release-candidate line to v1.0.0 until all of these are true:

- CI and security checks are green for the candidate commit;
- Windows/macOS/Linux desktop bundles build successfully;
- each target artifact has been installed, launched, smoke-tested, and uninstalled;
- recovery/autosave behavior is verified in the packaged application;
- manual screen-reader/accessibility matrix results are recorded;
- packaged startup/package-size measurements are recorded;
- compatibility/support policy has been reviewed against the actual release targets;
- signing/notarization status is recorded accurately for each artifact;
- release-build screenshots replace illustrative screenshots where the release plan requires them;
- no blocker/critical defect is knowingly open.

## Publishing

Publish a draft release only after:

- all expected platform artifacts exist;
- source/CI/security gates are green;
- required smoke testing is complete for the release's stated status;
- changelog/date/version links are correct;
- known limitations are documented;
- checksums/signature information is attached when the distribution process provides it.

A v0.5.x preview/release-candidate may intentionally leave stable v1.0 manual gates open, but its release notes must say so clearly.

## Rollback

If a release has a security, data-loss, startup, or packaging defect, keep or return it to draft/unpublished state when possible, fix the defect on `main`, add a regression test, and create a new patch release. Do not silently replace a published binary under the same version tag.

**Made by the Sanskar**
