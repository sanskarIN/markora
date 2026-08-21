# Security Policy

Security and privacy are release requirements for Markora. Please report suspected vulnerabilities privately so users have time to receive a fix before technical exploitation details are made public.

## Supported versions

Until the first stable release, security fixes target the current `main` branch and the newest published preview release. After stable releases begin, this table will be updated with explicit support windows.

| Version | Security support |
| --- | --- |
| `main` / current preview | Supported |
| Older preview builds | Best effort; upgrade is normally required |

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

Markora is a local-first desktop editor. Important trust boundaries include:

- Markdown document content;
- filenames and filesystem paths;
- imported workspace backups;
- rendered Markdown links;
- exported HTML;
- native desktop dialogs and file writes;
- webview-to-Rust invoke commands;
- build/release dependencies and artifacts.

Current defensive design includes:

- sanitized Markdown rendering;
- no unrestricted raw HTML execution in preview/export;
- external URL scheme allow-listing;
- remote Markdown image blocking;
- restrictive webview/browser CSP;
- narrow Tauri capabilities;
- bounded native file sizes;
- extension, regular-file, symlink, and UTF-8 validation;
- temporary-file replacement for native writes;
- structured log redaction;
- versioned/validated recovery and backup data;
- CodeQL, dependency audit, and secret scanning workflows.

See `docs/architecture.md` and the ADRs for design details.

## Out of scope / lower-priority reports

The following are normally not treated as vulnerabilities by themselves:

- attacks requiring the user to deliberately modify and execute Markora source code;
- issues that only affect unsupported dependencies or operating systems after an upgrade path is available;
- social engineering unrelated to Markora-controlled channels;
- denial-of-service claims requiring unrealistically large local resources when existing size limits prevent the input path;
- missing security headers that do not apply to the Tauri local application context;
- automatic scanner output without a reproducible impact.

A report may still be useful as hardening feedback even when it does not qualify as a vulnerability.

## Dependency and supply-chain reporting

Please report compromised dependencies, typosquatting risks, suspicious release artifacts, or workflow-permission concerns privately when they could affect users. The repository intentionally uses limited GitHub workflow permissions and pinned top-level application dependency versions where practical.

## Safe research

Use your own test data and systems. Do not access other people's files, credentials, accounts, or devices; do not disrupt third-party services; and do not publicly disclose an unpatched issue in a way that creates avoidable user risk.

## Public disclosure and credit

When a report leads to a security fix, reporter credit can be included in release notes if the reporter wants it and coordinated disclosure is appropriate. Reporters may also request anonymity.

**Made by the Sanskar**
