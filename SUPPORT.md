# Support

Markora is an open-source, local-first Markdown editor. This page explains where to ask for help and what information is useful when diagnosing a problem.

## Support channels

- Support email: `supportramsandesh@gmail.com`
- Business email: `sanskarin@outlook.in`
- Alternate business email: `sanskarin.business@gmail.com`
- GitHub profile: https://github.com/sanskarIN
- Repository: https://github.com/sanskarIN/markora

For reproducible product defects that do not involve confidential information, use the repository's bug-report issue template.

For security vulnerabilities, follow `SECURITY.md` instead of opening a public issue.

## Before requesting help

Please check:

1. `README.md` for the current supported workflow.
2. `docs/setup.md` for platform prerequisites.
3. `docs/troubleshooting.md` for common build/runtime problems.
4. Existing GitHub issues for a matching report.
5. `CHANGELOG.md` for recent fixes or behavior changes.

## Information to include

Useful support requests contain:

- Markora version or commit SHA;
- operating system and version;
- whether the issue occurs in browser development mode or the Tauri desktop app;
- the command that failed, if applicable;
- the exact safe error message;
- minimal reproduction steps using fictional Markdown;
- whether the problem occurs after a clean restart/clean checkout.

Do **not** send your private document unless its exact content is essential and you have intentionally removed sensitive information. Prefer a tiny fictional reproduction.

## Build problems

For build/setup help, include outputs from the smallest relevant commands, for example:

```bash
node --version
npm --version
rustc --version
cargo --version
npm run typecheck
cargo check --manifest-path src-tauri/Cargo.toml
```

Review logs before sharing them. Remove usernames, private paths, credentials, or other personal data.

## Data recovery

Markora keeps a versioned local recovery snapshot of the current workspace. It also supports an explicit JSON workspace backup through Settings → Privacy & data.

Recovery storage is best effort and is not a replacement for normal file backups. If a document has already been saved to disk, preserve a copy of that file before experimenting with recovery or restore operations.

## Feature requests

Use the feature-request template and explain the user workflow being improved. Features should remain coherent with Markora's local-first design, security boundary, accessibility requirements, and desktop focus.

## Funding

If Markora is useful to you, optional support is available at:

https://buymeacoffee.com/sanskarIN

Donations are optional and do not unlock editing features.

**Made by the Sanskar**
