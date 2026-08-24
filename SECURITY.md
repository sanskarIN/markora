# Security Policy

Security and privacy are release requirements for Markora. Please report suspected vulnerabilities privately so users have time to receive a fix before technical exploitation details are made public.

## Supported versions

Markora is currently preparing the **v0.5.x release-candidate line** before the first stable v1.0 desktop release.

| Version | Security support |
| --- | --- |
| `main` / current v0.5.x candidate | Supported |
| Newest published preview/candidate | Supported while it remains the current preview line |
| Older preview builds | Best effort; upgrade is normally required |

After v1.0.0, the latest stable v1.x release line will receive security/data-loss fixes as described in `docs/support-policy.md`. Older patch releases may require upgrading to the newest patch instead of receiving backports.

## Reporting a vulnerability

Do **not** open a public GitHub issue for an unpatched vulnerability.

Send a report to:

- **Security/support:** `supportramsandesh@gmail.com`
- **Business:** `sanskarin@outlook.in`

If GitHub Private Vulnerability Reporting is enabled for the repository, that channel is also appropriate.

Include only the information needed to understand and reproduce the problem:

- affected Markora version/commit;
- operating system and architecture;
- affected feature or trust boundary;
- reproducible steps using fictional/non-sensitive data;
- expected versus observed behavior;
- security impact and realistic attacker prerequisites;
- a minimal proof of concept when needed;
- suggested mitigation if you have one.

Never send real passwords, API keys, tokens, private Markdown documents, signing keys, or unrelated personal data. Redact file paths if they reveal personal information.

## Response process

The project aims to:

1. acknowledge a well-formed report as soon as practical;
2. reproduce and classify the issue;
3. develop a focused fix with regression coverage where feasible;
4. review whether adjacent trust boundaries share the defect;
5. prepare patched builds/release notes;
6. coordinate public disclosure after a fix is available.

Exact response or release times cannot be guaranteed. Severity, reproducibility, platform packaging, and maintainer availability affect the schedule.

## Security model

Markora is a local-first editor. Important trust boundaries include:

- Markdown document content;
- filenames and filesystem paths/document-provider identifiers;
- imported workspace backups;
- rendered Markdown links;
- exported HTML;
- native desktop dialogs and file writes;
- mobile picker/filesystem scopes;
- webview-to-Rust invoke commands;
- Tauri capabilities/application-command permissions;
- build/release dependencies and artifacts.

Current defensive design includes:

- sanitized Markdown rendering;
- no unrestricted raw HTML execution in preview/export;
- external URL scheme allow-listing;
- remote Markdown image blocking;
- restrictive webview/browser CSP;
- platform-scoped least-privilege Tauri capabilities;
- explicit Tauri application-command manifest and command permission sets;
- frontend event listen/unlisten only, without broad core defaults or frontend emit permissions;
- bounded native/mobile file sizes;
- extension, regular-file, symlink, and UTF-8 validation where applicable;
- temporary-file replacement for native writes;
- structured log redaction;
- safe localized error presentation instead of exposing unknown native error strings directly;
- versioned/validated recovery and backup data;
- CodeQL, dependency audit, secret scanning, and capability regression checks.

The current pre-stable security re-review is recorded in `docs/security-review-2026-08.md`.

## Current residual hardening item

Desktop custom file commands accept path parameters for already-known/recent files. Those native commands validate extension/type/size/symlink boundaries, and they are available only to the local main webview through an explicit command ACL. The command parameter itself is not yet restricted by a native persisted path allowlist.

This is tracked as defense-in-depth rather than a known blocker under the current CSP/sanitized-rendering/no-remote-capability model. A future hardening change should implement native authorization state rather than trusting a frontend-provided "authorized" flag.

## Out of scope / lower-priority reports

The following are normally not treated as vulnerabilities by themselves:

- attacks requiring the user to deliberately modify and execute Markora source code;
- issues that only affect unsupported dependencies or operating systems after an upgrade path is available;
- social engineering unrelated to Markora-controlled channels;
- denial-of-service claims requiring unrealistically large local resources when existing size limits prevent the input path;
- missing web security headers that do not apply to the Tauri local application context;
- automatic scanner output without a reproducible impact.

A report may still be useful as hardening feedback even when it does not qualify as a vulnerability.

## Dependency and supply-chain reporting

Please report compromised dependencies, typosquatting risks, suspicious release artifacts, or workflow-permission concerns privately when they could affect users. The repository intentionally uses limited GitHub workflow permissions and pinned top-level application dependency versions where practical.

Do not "fix" dependency warnings by changing versions without running the repository/Rust/mobile/build verification required for the affected dependency boundary.

## Signing and release trust

Signing/notarization strategy and credential isolation are documented in `docs/signing.md`. A release artifact must not be described as signed/notarized until its actual signature/notarization has been verified.

Unsigned CI artifacts can be useful for testing but are not automatically trusted production installers.

## Safe research

Use your own test data and systems. Do not access other people's files, credentials, accounts, or devices; do not disrupt third-party services; and do not publicly disclose an unpatched issue in a way that creates avoidable user risk.

## Public disclosure and credit

When a report leads to a security fix, reporter credit can be included in release notes if the reporter wants it and coordinated disclosure is appropriate. Reporters may also request anonymity.

**Made by the Sanskar**
