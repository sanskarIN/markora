# Markora on Android

Markora supports Android through Tauri 2 while preserving the project's local-first and permission-minimizing design.

## Supported Android version

Markora sets `minSdkVersion` to 24, which corresponds to Android 7.0 or newer and matches Tauri's minimum Android SDK support.

## What works on Android

- Local Markdown editing and sanitized preview.
- Multiple tabs and local recovery snapshots.
- Native Android document picker for Markdown and text files.
- Native save picker for Markdown files.
- Recent-file reopening for files whose picker scope is persisted.
- HTML export through the Android document picker.
- Workspace backup export/import through the Android document picker.
- Safe external HTTP, HTTPS, and mail links through the platform opener.
- `Open with Markora` / share intents for Markdown and text documents.
- Existing responsive phone layout, including single-pane editing on narrow screens.

Path-backed autosave and desktop fingerprint conflict detection remain desktop-only. Android keeps Markora's recovery snapshot locally and saves to an external document when the user explicitly saves. This avoids writing repeatedly through document-provider URIs without an explicit mobile conflict model.

## Prerequisites

Install:

- Node.js 22.12 or newer and npm 10 or newer.
- Stable Rust.
- Android Studio.
- Android SDK Platform.
- Android SDK Platform-Tools.
- Android SDK Build-Tools.
- Android SDK Command-line Tools.
- Android NDK (side by side). Prefer a current NDK; NDK 28 or newer is recommended for modern 16 KB page-size compatibility.
- Java/JDK available through Android Studio's JBR or a compatible JDK.

Set the Android environment variables for your shell.

### Linux

```bash
export JAVA_HOME=/opt/android-studio/jbr
export ANDROID_HOME="$HOME/Android/Sdk"
export NDK_HOME="$ANDROID_HOME/ndk/$(ls -1 "$ANDROID_HOME/ndk" | sort -V | tail -n 1)"
```

### macOS

```bash
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export ANDROID_HOME="$HOME/Library/Android/sdk"
export NDK_HOME="$ANDROID_HOME/ndk/$(ls -1 "$ANDROID_HOME/ndk" | sort -V | tail -n 1)"
```

### Windows PowerShell

```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$ndkVersion = Get-ChildItem -Name "$env:ANDROID_HOME\ndk" | Sort-Object {[version]$_} | Select-Object -Last 1
$env:NDK_HOME = "$env:ANDROID_HOME\ndk\$ndkVersion"
```

Add the Android Rust targets:

```bash
rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android
```

## Initialize the generated Android project

From the repository root:

```bash
npm install
npm run android:init
npm run icons
```

Tauri creates the Android Studio project under `src-tauri/gen/android/`. The generated project is build output and can be recreated from the checked-in Tauri configuration.

If the application identifier or Android-specific configuration changes incompatibly, delete the generated Android project and initialize it again:

```bash
rm -rf src-tauri/gen/android
npm run android:init
npm run icons
```

On Windows, remove `src-tauri\gen\android` using File Explorer or PowerShell before re-running the commands.

## Run on an emulator or device

Create/start an Android Virtual Device in Android Studio, or connect a physical device with USB debugging enabled. Then run:

```bash
npm run android:dev
```

To open the generated project in Android Studio:

```bash
npm run android:open
```

## Build an APK

For a debug APK suitable for device testing:

```bash
npm run android:build -- --debug --apk --target aarch64
```

For a release APK:

```bash
npm run android:build -- --apk --split-per-abi
```

Unsigned or debug artifacts are not Play Store releases. Release signing is a separate credential-sensitive step.

## Build an Android App Bundle

Google Play distribution uses an Android App Bundle:

```bash
npm run android:build -- --aab
```

The generated universal release bundle is normally placed under:

```text
src-tauri/gen/android/app/build/outputs/bundle/universalRelease/
```

Do not commit signing keystores, signing passwords, service-account credentials, or generated secret property files. Markora's `.gitignore` excludes common key/certificate formats, but release maintainers must still verify that no secret is staged before committing.

## Android file access model

Markora does not request broad storage access. The mobile capability grants only:

- open/save dialog access;
- metadata checks for a selected document;
- text reads/writes for selected document paths;
- safe default URL opening.

The dialog plugin adds selected document paths to the filesystem scope, and the persisted-scope plugin restores those scopes after restart. Markora initializes the filesystem plugin before persisted-scope so the restored paths are available to Recent Files.

Android document providers may return `content://` URIs instead of filesystem paths. Markora treats those values as opaque user-selected document identifiers and passes them to Tauri's filesystem plugin rather than trying to convert them into unrestricted filesystem paths.

## Open-with and share intents

`src-tauri/tauri.android.conf.json` registers Markdown and plain-text document associations for Android `View`, `Send`, and `SendMultiple` actions. Tauri's `RunEvent::Opened` values are captured in Rust, queued for cold starts, emitted for warm starts, and routed through the same bounded document-opening path used by the workspace.

This means externally opened files still receive Markora's size checks, supported-file handling, and user-safe errors.

## CI verification

`.github/workflows/android.yml` initializes the generated Android project on an Ubuntu runner, resolves the runner's Android SDK/NDK, builds an ARM64 debug APK, and uploads the APK as a short-lived workflow artifact.

The Android job intentionally verifies an unsigned debug artifact only. Production signing material must never be placed in normal pull-request CI.

## Manual Android release checklist

Before publishing an Android release:

1. Run the normal frontend and Rust quality checks.
2. Confirm the Android CI job succeeds from a clean checkout.
3. Test open, edit, save, Save As, recent-file reopen, HTML export, backup export/import, external links, and `Open with Markora` on a physical Android device.
4. Test narrow portrait and landscape layouts with the software keyboard visible.
5. Test Android back navigation around dialogs and modal UI.
6. Verify recovery after force-closing the application with an unsaved document.
7. Verify the release build uses a current NDK and passes Android/Play 16 KB page-size checks where applicable.
8. Verify the package identifier is `in.sanskar.markora`.
9. Configure signing outside the repository and build the release AAB.
10. Inspect the final manifest and permissions before upload.
11. Install/test the signed artifact before promoting it to a production track.

## Troubleshooting

### Android SDK or NDK not found

Confirm `ANDROID_HOME` and `NDK_HOME` point to directories that actually exist, then restart the terminal or IDE.

### Android project does not match the package identifier

Delete `src-tauri/gen/android`, run `npm run android:init`, and regenerate icons.

### Device is not listed

Check:

```bash
adb devices
```

For a physical device, confirm USB debugging and accept the computer authorization prompt on the device.

### Recent file cannot be reopened

The original Android document provider may have removed/revoked the URI or the file may have moved. Reopen the document with the native Open action to grant access again.

### Build works locally but Play validation fails

Use a current Android toolchain and NDK, rebuild the AAB cleanly, and inspect Play Console's exact compatibility/signing message. Do not weaken Markora's file permissions or CSP as a workaround for packaging problems.

**Made by the Sanskar**
