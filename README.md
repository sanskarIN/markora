<div align="center">
  <img src="assets/markora-logo.svg" alt="Markora logo" width="120" height="120" />

# Markora

**A polished, local-first Markdown workspace for Windows, macOS, and Linux.**

[![CI](https://github.com/sanskarIN/markora/actions/workflows/ci.yml/badge.svg)](https://github.com/sanskarIN/markora/actions/workflows/ci.yml)
[![CodeQL](https://github.com/sanskarIN/markora/actions/workflows/codeql.yml/badge.svg)](https://github.com/sanskarIN/markora/actions/workflows/codeql.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-sanskarIN-FFDD00?logo=buy-me-a-coffee&logoColor=000000)](https://buymeacoffee.com/sanskarIN)

**Made by the Sanskar**

</div>

![Markora editor interface preview](docs/images/editor-preview.svg)

> The image above is editable project artwork that represents the implemented layout. Release screenshots should be refreshed from signed release builds before major public launches.

## Why Markora?

Markora is designed for people who want a serious Markdown editor without creating an account or sending their writing to a service by default. It combines a fast React/TypeScript editing experience with a small Rust/Tauri desktop shell, validated native file operations, automatic local recovery, a sanitized GitHub-Flavored Markdown preview, and a keyboard-first workflow.

The application intentionally treats document contents as sensitive: raw Markdown is not intentionally logged, remote preview images are blocked, unsafe link schemes are rejected, and desktop filesystem access is exposed through a narrow validated command surface rather than broad webview permissions.

## Features

- **Markdown editor + live preview** with CommonMark/GFM behavior.
- **Safe rendering pipeline** using `react-markdown`, `remark-gfm`, `rehype-sanitize`, heading slugs, and fenced-code syntax highlighting.
- **Privacy-oriented preview** that blocks raw HTML execution, unsafe URL schemes, and remote image requests by default.
- **Multiple document tabs** with dirty-state indicators and recent-file reopening.
- **Outline navigation + breadcrumbs** derived from ATX headings while ignoring fenced code blocks.
- **Find and replace** with case matching, next/previous navigation, single replace, and replace-all.
- **Word, character, line, and cursor status** for writing feedback.
- **Autosave for path-backed desktop files** plus versioned local recovery snapshots for all active tabs.
- **Workspace backup and restore** with validated versioned JSON envelopes.
- **HTML export** through the same sanitized renderer used by the preview.
- **Print/PDF workflow** using a dedicated print stylesheet and the operating system/browser print-to-PDF capability.
- **Command palette and keyboard shortcuts** for the primary editing workflow.
- **Light, dark, and system appearance**, plus Graphite, Aurora, and Paper editor themes.
- **Distraction-free writing mode** and configurable typography.
- **Responsive/adaptive layout** with desktop-first behavior and narrow-window fallbacks.
- **Accessibility basics** including semantic controls, keyboard access, focus visibility, reduced motion, labels, and non-color-only status indicators.
- **Local-first onboarding, settings, privacy, accessibility, update, and About experiences**.
- **Cross-platform native packaging** for Windows, macOS, and Linux through Tauri.

## Supported platforms

| Platform | Target | Notes |
| --- | --- | --- |
| Windows | Windows 10/11 | WebView2-based Tauri desktop app |
| macOS | Current supported macOS releases | WebKit-based Tauri desktop app |
| Linux | Modern desktop distributions | Requires WebKitGTK 4.1-compatible runtime/build dependencies |
| Browser | Development preview | Useful for frontend development; native disk/recent-file behavior has safe browser fallbacks or is unavailable |

Release artifacts are produced by the repository release workflow. Platform support is only considered verified after the relevant CI/release build passes.

## Technology stack

- **Desktop shell:** Rust + Tauri 2
- **Frontend:** React 19 + TypeScript + Vite
- **Markdown:** `react-markdown`, `remark-gfm`, `rehype-sanitize`, `rehype-slug`, `rehype-highlight`
- **Native dialogs:** `rfd`
- **Atomic file replacement:** `tempfile`
- **Testing:** Vitest, Testing Library, Playwright, Rust unit tests
- **Quality/security:** ESLint, Prettier, Clippy, rustfmt, CodeQL, cargo-audit, npm audit, Gitleaks
- **Automation:** GitHub Actions + Dependabot

## Quick start

### Requirements

Install:

- Node.js **22.12+** and npm **10+**
- Rust stable **1.85+** with Cargo
- Tauri platform prerequisites for your operating system

See [docs/setup.md](docs/setup.md) for platform-specific prerequisites.

### Development browser preview

```bash
git clone https://github.com/sanskarIN/markora.git
cd markora
npm install
npm run dev
```

Open `http://127.0.0.1:1420` if it does not open automatically.

### Desktop development

Generate platform icons once after a clean clone, then run Tauri:

```bash
npm install
npm run icons
npm run tauri:dev
```

## Full development setup

The complete setup guide covers Windows, macOS, Linux, Rust, platform webview dependencies, editor recommendations, and troubleshooting:

- [Setup](docs/setup.md)
- [Development workflow](docs/development.md)
- [Troubleshooting](docs/troubleshooting.md)

No `.env` secrets are needed for normal local editing. `.env.example` contains placeholder configuration names only.

## Testing and quality checks

Frontend checks:

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run test:coverage
npm run build
```

End-to-end browser journey tests:

```bash
npx playwright install chromium
npm run test:e2e
```

Rust checks:

```bash
cargo fmt --manifest-path src-tauri/Cargo.toml --all -- --check
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml --all-features
```

The CI workflow repeats these checks and then attempts desktop bundle builds on Ubuntu, macOS, and Windows. See [docs/testing.md](docs/testing.md).

## Build and release

Generate icons and create a local release bundle:

```bash
npm install
npm run icons
npm run tauri:build
```

Tagged versions matching `v*` trigger cross-platform packaging into a **draft GitHub Release** so artifacts can be inspected before publication. See [docs/release.md](docs/release.md) for version synchronization, verification, signing considerations, and the release checklist.

## Architecture overview

Markora is a modular desktop monolith:

```text
React UI
  ├─ components/          presentation and interaction
  ├─ hooks/               workspace orchestration
  ├─ lib/document.ts      Markdown/editor domain utilities
  ├─ lib/markdown.tsx     sanitized rendering/export
  ├─ lib/storage.ts       versioned recovery/backup
  ├─ lib/security.ts      URL and logging safety helpers
  └─ lib/platform.ts      native/web adapter boundary
            │
            │ Tauri invoke (desktop only)
            ▼
Rust command surface
  └─ validated dialogs, file reads/writes, exports, external URLs
```

The webview receives only `core:default` Tauri permissions. Filesystem and external-link behavior is routed through explicit Rust commands that validate extensions, file type, symlinks, size, UTF-8 data, and URL schemes. See [docs/architecture.md](docs/architecture.md) and [docs/adr/](docs/adr/).

## Security

Security-sensitive defaults include:

- restrictive Content Security Policy for both Tauri and browser-development entry points;
- raw HTML is not interpreted as executable preview HTML;
- `javascript:`, `data:`, `file:`, and other unapproved link schemes are blocked;
- external links are limited to HTTP, HTTPS, and mailto;
- remote Markdown images are represented as text instead of fetched automatically;
- Markdown reads and writes are bounded by safety limits;
- native reads reject symbolic links and non-regular files;
- saves/exports use temporary-file replacement where supported by the native implementation;
- logs redact paths, content-like keys, credentials, and secret-like fields;
- CI runs CodeQL, dependency audits, and history secret scanning.

Report vulnerabilities privately using [SECURITY.md](SECURITY.md). Do **not** post exploit details or private documents in a public issue.

## Privacy and data storage

Markora requires no account for local editing and contains no intentional analytics pipeline. Workspace recovery data is stored locally in the application webview storage. Path-backed files remain on disk at locations you choose. Backup/export files are only created when you request them.

The preview does not automatically load remote Markdown images. External links open only after an explicit click and scheme validation.

See [PRIVACY.md](PRIVACY.md) for the complete data-flow description.

## Accessibility

The interface is designed around keyboard-reachable native controls, persistent focus indicators, semantic dialogs/tabs/navigation, readable contrast, reduced-motion settings, and status text that does not rely only on color. Accessibility is an ongoing release requirement; see [docs/accessibility.md](docs/accessibility.md).

## Performance

The editor uses local computation and avoids network work in the editing path. Performance budgets and large-document considerations are tracked in [docs/performance.md](docs/performance.md).

## Contributing

Contributions are welcome. Please read:

1. [CONTRIBUTING.md](CONTRIBUTING.md)
2. [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
3. [SECURITY.md](SECURITY.md)
4. [docs/development.md](docs/development.md)
5. [docs/testing.md](docs/testing.md)

Small, atomic commits using Conventional Commit-style messages are preferred. Every behavior change should include the smallest practical verification or regression coverage.

## Project status and roadmap

- Current development version: **0.1.0**
- Changelog: [CHANGELOG.md](CHANGELOG.md)
- Roadmap: [ROADMAP.md](ROADMAP.md)
- Session/development handoff: [what_changed.md](what_changed.md)

`what_changed.md` is intentionally maintained as a precise continuation record for coding sessions and should not be treated as marketing copy.

## License

Markora is open source under the [MIT License](LICENSE).

Copyright © 2026 Sanskar.

## Support and contact

- GitHub: [https://github.com/sanskarIN](https://github.com/sanskarIN)
- Repository: [https://github.com/sanskarIN/markora](https://github.com/sanskarIN/markora)
- Business: [sanskarin@outlook.in](mailto:sanskarin@outlook.in)
- Business: [sanskarin.business@gmail.com](mailto:sanskarin.business@gmail.com)
- Support: [supportramsandesh@gmail.com](mailto:supportramsandesh@gmail.com)
- Buy Me a Coffee: [https://buymeacoffee.com/sanskarIN](https://buymeacoffee.com/sanskarIN)

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-sanskarIN-FFDD00?logo=buy-me-a-coffee&logoColor=000000)](https://buymeacoffee.com/sanskarIN)

Funding is optional. Markora's editing features are not gated behind donations.

---

<div align="center"><strong>Made by the Sanskar</strong></div>
