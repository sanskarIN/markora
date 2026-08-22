# Markora troubleshooting

Use this guide for common development and desktop-runtime problems. Do not paste private Markdown contents, credentials, or full sensitive filesystem paths into public issues.

## `npm install` fails

Check versions first:

```bash
node --version
npm --version
```

Markora requires Node.js 22.12+ and npm 10+.

If installation metadata appears stale, remove only generated dependency state and reinstall:

```bash
rm -rf node_modules
npm install
```

On Windows PowerShell, remove `node_modules` with the normal Windows filesystem command/UI instead of copying the Unix command literally.

Do not delete source files or recovery data to repair a package-manager issue.

## TypeScript, lint, or formatting failures

Run the checks independently to isolate the failure:

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

Use `npm run format` only when you intend to apply repository-wide formatting changes, then review the diff.

## Tauri cannot compile on Windows

Verify:

- Rust is installed and available in the current terminal.
- Microsoft C++ desktop build tools and a Windows SDK are installed.
- WebView2 Runtime is installed.
- You reopened the terminal after installing toolchains.

Then retry:

```powershell
cargo --version
npm run tauri:dev
```

## Tauri cannot compile on macOS

Confirm Xcode Command Line Tools:

```bash
xcode-select -p
```

If missing:

```bash
xcode-select --install
```

Then retry the Rust checks before the full Tauri build.

## Tauri cannot compile on Linux

The Ubuntu CI installs:

```bash
sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
```

Install equivalent WebKitGTK 4.1/Tauri packages for your distribution. A missing `webkit2gtk-4.1`, GTK, appindicator, or linker dependency is an environment problem rather than a frontend TypeScript problem.

## Browser preview works but file/recent actions differ

Expected. Browser development mode cannot safely emulate every desktop path operation. In browser mode:

- opening uses the browser file picker;
- saving/exporting downloads browser blobs;
- reopening an arbitrary stored desktop path is unavailable;
- Tauri custom commands do not exist.

Use `npm run tauri:dev` for native workflow verification.

## A recovered file will not autosave

Markora intentionally pauses autosave for recovered dirty path-backed files until the disk state is explicitly reconciled. This prevents a stale recovery snapshot from silently replacing a file that changed while Markora was closed.

Use **Settings → Privacy & data → Reload active file from disk** if the disk copy should win, or explicitly save after reviewing the recovery copy if the editor copy should win.

## Autosave says the file changed outside Markora

Another application or process changed the file fingerprint after Markora opened/saved it. Autosave pauses instead of overwriting that change.

Review the external copy and either reload from disk or explicitly save after deciding which version should win.

## Drag-and-drop file is rejected

Markora accepts only supported Markdown/text paths within its bounded file-size rules. Native validation also rejects symbolic links for direct monitored/read paths. Open a regular supported file instead of bypassing the validation.

## Preview link does not open

Only approved URL schemes are allowed. HTTP, HTTPS, mailto, and safe in-document anchors are supported; executable or local-file schemes are blocked by design.

## Remote Markdown image is shown as text

Expected privacy behavior. Markora does not automatically fetch remote Markdown images, because image requests can disclose IP/referrer/network metadata. The preview/export represents them as blocked image text.

## Print/PDF page settings appear ignored

The final print pipeline is controlled by the operating system/browser print engine. Markora supplies a print-only stylesheet for page size, margins, code wrapping, heading-break behavior, and metadata, but some printer drivers can override page settings.

Check the system print dialog for a conflicting paper size or margin override.

## Playwright fails locally

Install the configured Chromium runtime:

```bash
npx playwright install chromium
```

On Linux CI-like environments, system dependencies may also be required:

```bash
npx playwright install --with-deps chromium
```

Then rerun:

```bash
npm run test:e2e
```

## Recovery snapshot is malformed or too large

Markora validates recovery snapshots and has a local storage safety limit. Invalid snapshots are ignored rather than trusted. Use a known-good exported Markora backup if available.

Do not manually edit recovery JSON unless you understand the versioned schema and have another copy of the document data.

## Reporting a reproducible defect

Collect only non-sensitive information:

- operating system/version;
- Markora version/commit;
- exact action sequence;
- expected vs actual result;
- whether it reproduces in browser mode, desktop mode, or both;
- sanitized error text with private paths/content removed.

Use `SECURITY.md` for security vulnerabilities instead of a public issue.
