# Markora release guide

Markora releases should be treated as verification events, not only packaging events. The release workflow builds a draft GitHub Release from tags matching `v*` on Ubuntu, macOS, and Windows.

## Before tagging

Confirm the working branch is clean and review `CHANGELOG.md`, `ROADMAP.md`, and `what_changed.md`.

Run the frontend quality gate:

```bash
npm install
npm run quality
npx playwright install chromium
npm run test:e2e
```

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

## Version synchronization

Before a release, keep user-visible/package versions synchronized across the files that define them, including:

- `package.json`;
- Tauri configuration/package metadata under `src-tauri/`;
- `CHANGELOG.md`;
- release notes and documentation that state a concrete version.

Do not publish a tag whose package metadata still identifies a different release.

## Tagging

Use an annotated or signed tag when the release process supports it. Example:

```bash
git tag -a v0.1.0 -m "Markora v0.1.0"
git push origin v0.1.0
```

Pushing a `v*` tag starts `.github/workflows/release.yml`.

## What the release workflow does

For Ubuntu, macOS, and Windows the workflow:

1. checks out the tagged commit;
2. installs Node.js and stable Rust;
3. installs Linux WebKitGTK/Tauri dependencies where required;
4. installs frontend dependencies;
5. generates platform icons;
6. runs the Tauri packaging action;
7. creates/updates a **draft** GitHub Release named for the package version.

Draft status is intentional. Do not publish the release merely because artifacts exist.

## Draft release verification

For each produced platform artifact:

- confirm the filename/version/architecture are expected;
- install it on the matching supported operating system;
- launch Markora from the installed package;
- create/edit a Markdown document;
- open and save a path-backed file;
- verify autosave and external-change protection;
- restart and verify recovery/session behavior;
- test sanitized preview and an external HTTPS link;
- export self-contained HTML;
- exercise print/PDF with at least default and one non-default print configuration;
- test keyboard shortcuts, command palette, settings, and recovery controls;
- inspect About/version text;
- uninstall using the platform's normal process.

Do not use real sensitive documents for release smoke testing.

## Signing and notarization

The repository can build unsigned artifacts without private platform credentials. Production distribution should document and use appropriate signing/notarization credentials when available:

- Windows code-signing certificate;
- Apple Developer signing identity and notarization credentials;
- distribution-specific Linux signing/checksum practices where relevant.

Never commit signing secrets, certificates, private keys, tokens, or notarization passwords to the repository.

## Reproducibility expectations

Markora's HTML export is deterministic for the same Markdown/title aside from environment-independent renderer/library behavior and contains inline local styles only. Print-to-PDF is intentionally delegated to the platform print engine, so byte-for-byte identical PDFs across operating systems/printer engines are not currently guaranteed.

For PDF verification, compare semantic/rendered output rather than file hashes across different platforms. Record the OS, webview, paper size, margins, code-wrap setting, and metadata setting used for a release smoke test.

## Release screenshots

The README currently uses editable illustrative artwork. Replace it with screenshots captured from a verified packaged release only after:

- the release candidate launches successfully on supported targets;
- visible version/theme state is intentional;
- no private filenames/content appear in the capture;
- the screenshot matches the shipped interface.

## Publishing

Publish the draft only after:

- CI and security checks are green for the release commit/tag;
- all expected platform artifacts exist;
- smoke testing is complete;
- changelog/date/version links are correct;
- known limitations are documented;
- checksums/signature information is attached when the distribution process provides it.

## Rollback

If a release has a security, data-loss, startup, or packaging defect, keep or return it to draft/unpublished state when possible, fix the defect on `main`, add a regression test, and create a new patch release. Do not silently replace a published binary under the same version tag.
