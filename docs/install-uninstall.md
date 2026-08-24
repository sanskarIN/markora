# Markora installation and uninstall verification

This guide covers the release-candidate installation and removal checks for packaged Markora desktop builds. Exact filenames can vary by Tauri/bundler version and architecture; use the artifact attached to the release candidate rather than assuming a filename.

## Safety before installation

For an official release candidate:

1. obtain the artifact from the project's GitHub Release created from the expected tag;
2. confirm the visible version matches the tag and repository metadata;
3. inspect any published checksum/signature information when available;
4. do not disable operating-system security protections merely to make an unknown artifact run;
5. use synthetic/non-sensitive Markdown for verification.

Unsigned development artifacts may trigger platform warnings. That is not equivalent to a verified signed public release.

## Windows

### Install

Depending on the bundle produced by Tauri, the release may include an MSI and/or setup executable.

1. Launch the installer normally.
2. Keep Windows security warnings visible; do not instruct users to bypass reputation/signature warnings for an unverified build.
3. Complete installation using the installer's normal flow.
4. Launch Markora from the installed application entry.
5. Open Settings/About and verify the expected version.

### Smoke test

- Create a new Markdown document.
- Open a local Markdown file.
- Edit and save it.
- Restart Markora and verify workspace recovery.
- Export HTML and exercise Print/PDF.
- Test keyboard navigation and Settings.

### Uninstall

Use Windows **Settings → Apps → Installed apps** (or the equivalent Apps & features interface), locate Markora, and choose **Uninstall**.

After uninstalling, verify that the application executable/launcher entry is removed. User-created Markdown/export/backup files must not be deleted by uninstall.

Application-local recovery/preferences may remain in the platform webview/application data location unless the installer explicitly provides a user-data removal option. Do not delete user document directories as part of cleanup.

## macOS

### Install

The release workflow may produce an application bundle and/or DMG depending on bundler output.

1. Open the release artifact using the normal macOS flow.
2. Move/install Markora as directed by the package.
3. Launch the installed application.
4. Verify the version in Settings/About.
5. For public distribution, verify signing/notarization status rather than teaching users to bypass Gatekeeper.

### Smoke test

Exercise open/save/restart recovery, safe preview, HTML export, Print/PDF, keyboard navigation, and Settings using non-sensitive files.

### Uninstall

Remove Markora using the normal macOS application-removal flow for the installed package, typically by moving the application from Applications to Trash.

Do not remove user-created Markdown/export/backup files. Application-local preferences/recovery data may persist unless deliberately removed as a separate cleanup step.

## Linux

Tauri can emit multiple Linux package formats. Install and remove the exact package with the normal package-manager/application mechanism for that format and distribution.

### Debian/Ubuntu-family package

For a `.deb`, use the system's normal graphical installer or package manager. During release verification, record the package name reported by the installed package so the matching normal uninstall command/interface can be used.

### AppImage

An AppImage is generally run as a standalone application image rather than installed through a package database. Removing that AppImage file removes the application binary; desktop integration created by a separate tool may need to be removed separately.

### RPM/other packages

Use the distribution's standard package manager and record the exact package identity during verification.

### Linux smoke test

Verify launch, open/save, restart recovery, preview, export, Print/PDF where supported by the desktop environment, keyboard navigation, and Settings.

User-created files must remain untouched after package removal.

## Upgrade verification

Before v1.0 publication and for later stable upgrades:

1. install the previous verified version;
2. create a synthetic unsaved recovery state and saved preferences;
3. close the previous version normally;
4. install the release candidate over/alongside it using the platform's normal upgrade path;
5. verify compatible settings/recovery load correctly;
6. verify opening/saving/export still works;
7. confirm the displayed version changed to the new release;
8. uninstall and verify user-created files remain.

If an installer cannot safely perform an in-place upgrade, document that limitation in the release notes rather than silently replacing user data.

## Clean-install verification

A release should also be tested on a machine/user profile where Markora has not previously been installed. This catches hidden dependencies on stale preferences, generated files, or earlier runtime setup.

## Data ownership during uninstall

Markora must treat these as user-owned and never remove them automatically during a normal uninstall:

- Markdown/text documents;
- HTML exports;
- PDF output created through the system print flow;
- workspace backup JSON files;
- any other file explicitly saved by the user outside application-private storage.

Application-private recovery/preferences can be removed only through an explicit cleanup/reset action or a clearly labeled platform uninstall option where supported.

## Release verification record

For each platform artifact, record:

- release tag/commit SHA;
- OS version and architecture;
- artifact filename/package type;
- signature/notarization status;
- install result;
- smoke-test result;
- upgrade result when applicable;
- uninstall result;
- any retained application-private data that is expected by design.

Do not mark a release artifact as verified solely because CI built it successfully.

**Made by the Sanskar**
