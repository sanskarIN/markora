# Markora setup

This guide prepares a local development environment for Markora. The application is a React/TypeScript frontend packaged with Tauri 2 and a Rust native shell.

## Required toolchain

Install these first:

- Node.js 22.12 or newer.
- npm 10 or newer.
- Stable Rust with Cargo, rustfmt, and Clippy.
- Git.
- The operating-system prerequisites required by Tauri/WebView.

Confirm the core tools:

```bash
node --version
npm --version
rustc --version
cargo --version
rustfmt --version
cargo clippy --version
git --version
```

## Clone and install

```bash
git clone https://github.com/sanskarIN/markora.git
cd markora
npm install
```

Markora does not require application secrets or an account for normal local editing. `.env.example` contains placeholders only.

## Windows

Use a current Windows 10 or Windows 11 environment with:

- Microsoft Edge WebView2 Runtime.
- Visual Studio Build Tools/Visual Studio with the C++ desktop toolchain and a current Windows SDK.
- Stable Rust installed with the MSVC target selected by rustup.

After installing prerequisites:

```powershell
npm install
npm run icons
npm run tauri:dev
```

If Rust was installed before the Visual C++ build tools, reopen the terminal after the toolchain installation so environment discovery is refreshed.

## macOS

Install Xcode Command Line Tools:

```bash
xcode-select --install
```

Then install Node.js and Rust, clone the repository, and run:

```bash
npm install
npm run icons
npm run tauri:dev
```

Code signing and notarization are release concerns; they are not required for normal local development.

## Linux

Markora uses the WebKitGTK 4.1 Tauri runtime/build path. Package names vary by distribution. The Ubuntu CI runner installs:

```bash
sudo apt-get update
sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
```

Install the equivalent packages for your distribution, then run:

```bash
npm install
npm run icons
npm run tauri:dev
```

## Android

Android uses the same React/TypeScript application with Tauri's mobile shell, native document picker, scoped filesystem plugin, persisted document scopes, and platform URL opener.

Install Android Studio plus the Android SDK Platform, Platform-Tools, Build-Tools, command-line tools, and side-by-side NDK. Configure `JAVA_HOME`, `ANDROID_HOME`, and `NDK_HOME`, then install the Rust Android targets.

Initialize and run Markora with:

```bash
npm install
npm run android:init
npm run icons
npm run android:dev
```

Build an ARM64 debug APK with:

```bash
npm run android:build -- --debug --apk --target aarch64
```

See [android.md](android.md) for complete Linux/macOS/Windows environment setup, Android file-access behavior, APK/AAB builds, CI verification, testing, signing boundaries, and release checks.

## Browser-only frontend development

For UI work that does not require native file APIs:

```bash
npm run dev
```

Vite binds to `127.0.0.1:1420`. Browser mode intentionally cannot reopen arbitrary recent desktop paths and uses browser-safe file download/open fallbacks.

## Generate icons

The repository keeps the editable logo source in `assets/markora-logo.svg`. Generate platform icon assets with:

```bash
npm run icons
```

Generated icons should match the repository configuration before packaging.

## First verification

Run the frontend quality gate:

```bash
npm run quality
```

Run Rust checks:

```bash
cargo fmt --manifest-path src-tauri/Cargo.toml --all -- --check
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml --all-features
```

For the full matrix including Playwright and Android packaging, see `docs/testing.md` and `.github/workflows/android.yml`.

## IDE guidance

Any editor is supported. For VS Code, useful capabilities include TypeScript/React language support, rust-analyzer, ESLint, Prettier, and TOML support. Android Studio is additionally recommended for Android SDK/AVD management and native Android project inspection. Do not install extensions that require uploading private Markdown content in order to edit Markora documents.

## Data locations and privacy during development

- Document files stay at paths explicitly selected by the user.
- Android document-provider access is restricted to picker-selected paths and persisted scopes.
- Workspace recovery is stored in local webview/browser storage.
- Markora does not require telemetry, analytics, authentication, or cloud sync.
- External links are validated before opening.
- Remote Markdown images are not fetched by the preview.

See `PRIVACY.md` and `SECURITY.md` before changing storage, rendering, link handling, or native filesystem behavior.
