# Privacy

Markora is designed as a **local-first Markdown editor**. Normal editing does not require an account, a remote document service, analytics, or telemetry.

This document describes the privacy behavior implemented in the repository. Distribution platforms and operating systems may have their own privacy behavior outside Markora's control.

## Data Markora handles

Markora may handle:

- Markdown text you type or open;
- filenames and local filesystem paths for files you choose;
- editor settings such as theme, font size, panel visibility, and autosave preference;
- a list of recently opened local file paths;
- versioned recovery snapshots of open tabs;
- explicit workspace backup files you choose to export;
- exported HTML/PDF output you choose to create.

## Where data is stored

### Markdown files

Saved documents are written to filesystem locations you select through the desktop save dialog. Existing path-backed files can be autosaved when autosave is enabled.

### Recovery snapshot

The current workspace is serialized into the app's local webview storage under a versioned key. It contains open-tab content so an unexpected shutdown can be recovered. The implementation imposes a storage safety limit and validates data before restoring it.

### Recent files

Recent-file entries are kept inside the same local workspace state. They contain local paths and display names. They are not intentionally uploaded by Markora.

### Settings/onboarding

Appearance, accessibility, autosave, panel preferences, and onboarding completion are persisted locally.

### Backups

Workspace backups are only created after an explicit export action. Backups are JSON files that may contain the full text of open documents, so treat them as sensitive files.

## Network behavior

The editing path is designed not to require network access.

- Markdown preview does not automatically fetch remote images; image syntax is represented as text in the preview/export renderer.
- Raw document HTML is not executed.
- External links require an explicit user click and are restricted to approved schemes (`http`, `https`, and `mailto`).
- The source code contains project/support links that only open after you choose them.
- Development tools such as npm, Cargo, GitHub Actions, dependency checks, and update/release pages naturally require network access outside normal editing.

## Analytics and advertising

The repository contains no intentional analytics, advertising SDK, tracking pixel, or account-sign-in system.

## Logging

Frontend logging is structured and passes context through a redaction layer. Keys that look like document content, tokens, passwords, authentication values, cookies, secrets, or file paths are removed/redacted before output. Long string values are truncated.

Document content should never be deliberately added to logs. If you contribute code, preserve this rule.

Operating systems, webviews, crash reporters installed by the operating system, developer tools, or packaging/distribution services may generate logs outside this application code.

## Markdown rendering privacy

The preview/export renderer uses a sanitization pipeline and replaces Markdown images with a non-network textual placeholder. This prevents a Markdown file from silently causing a remote image host to receive the user's IP address simply because the document was previewed.

Links are not followed automatically.

## Native filesystem access

The webview does not receive broad arbitrary filesystem permissions. Desktop file operations use explicit Rust commands and native dialogs. Reads and writes validate relevant file properties and enforce bounded input sizes.

## Backup and deletion

To remove Markora-created data:

- delete document/export/backup files from the filesystem locations where you saved them;
- clear the application's local site/webview storage to remove recovery/settings state;
- uninstall the app and remove remaining application data using your operating system's normal application-data controls if desired.

Markora does not maintain a cloud account that must be separately deleted.

## Sensitive information

Markdown files can contain highly sensitive information. Markora reduces automatic disclosure risk but cannot protect a document after you intentionally:

- save it to an insecure/shared location;
- send/upload it elsewhere;
- open an external link;
- include it in an unencrypted backup;
- expose it through operating-system backups, malware, another local user, or compromised system software.

Use operating-system disk encryption and appropriate filesystem permissions when your threat model requires them.

## Changes to this privacy document

Privacy-relevant behavior changes should update this file and `CHANGELOG.md`. Significant architecture changes should also receive an ADR in `docs/adr/`.

## Contact

Questions about Markora privacy behavior:

- `supportramsandesh@gmail.com`
- `sanskarin@outlook.in`

Security vulnerabilities should follow `SECURITY.md`.

**Made by the Sanskar**
