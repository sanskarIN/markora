# Contributing to Markora

Thank you for improving Markora. Contributions should preserve the project's local-first, secure, accessible, maintainable design rather than only increasing feature count.

## Before you start

- Search open issues, pull requests, and `ROADMAP.md` for related work.
- For large behavior or architecture changes, open a focused feature request first so the design can be discussed before implementation.
- Security vulnerabilities must follow `SECURITY.md`, not a public issue.
- Never include private Markdown documents, credentials, tokens, signing secrets, personal information, or private endpoints in issues, tests, fixtures, screenshots, or commits.

## Development setup

Read `docs/setup.md`, then:

```bash
git clone https://github.com/sanskarIN/markora.git
cd markora
npm install
npm run icons
npm run tauri:dev
```

For frontend-only work, `npm run dev` is usually faster.

## Branches

Create a short-lived branch from the current default branch. Examples:

```text
feat/find-history
fix/recovery-validation
security/link-policy
refactor/native-errors
```

Keep a branch focused on one coherent change.

## Commit style

Small, atomic, meaningful commits are preferred. Conventional Commit-style messages are encouraged:

```text
feat: add ...
fix: handle ...
test: cover ...
docs: document ...
refactor: simplify ...
perf: optimize ...
security: harden ...
build: configure ...
ci: verify ...
chore: maintain ...
```

Do not create empty commits or meaningless churn to inflate history.

## Code expectations

### TypeScript and React

- Keep TypeScript strict-mode clean.
- Prefer small components and pure domain helpers.
- Do not put filesystem or security rules directly in presentation components.
- Preserve semantic HTML and keyboard behavior.
- Keep user-visible strings ready to move through the i18n layer.
- Avoid global mutable state.
- Do not log document contents or file paths without redaction.

### Rust and Tauri

- Keep the invoke surface narrow.
- Validate untrusted paths, file types, sizes, encodings, and URL schemes.
- Do not grant broad filesystem/shell capabilities when a validated command is sufficient.
- Return user-safe errors; do not leak sensitive paths in UI-facing messages.
- Add regression tests for parser, validation, and file-operation defects when feasible.

### Markdown rendering

All preview/export rendering must use the sanitized pipeline. Do not introduce `dangerouslySetInnerHTML`, unrestricted raw HTML plugins, automatic remote image fetching, or unvalidated external URLs.

## Verification

Run the smallest relevant checks while developing and the complete applicable set before requesting review.

Frontend:

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run test:coverage
npm run build
```

End-to-end:

```bash
npx playwright install chromium
npm run test:e2e
```

Rust:

```bash
cargo fmt --manifest-path src-tauri/Cargo.toml --all -- --check
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml --all-features
```

Desktop packaging when relevant:

```bash
npm run icons
npm run tauri:build
```

## Tests

- Domain rules belong in unit tests.
- Security regressions must include explicit malicious/edge inputs.
- UI behavior should use Testing Library with accessibility-oriented queries.
- Primary journeys should be covered by Playwright when they can run without real credentials.
- Rust path/file behavior should use deterministic temporary directories and fictional data.

Avoid flaky sleeps and external-network-dependent fixtures.

## Accessibility checklist

For UI changes, verify:

- keyboard reachability;
- visible focus;
- meaningful accessible names;
- correct dialog/tab/navigation semantics;
- adequate text/control contrast;
- usable layout at narrow widths and zoomed/scaled text;
- status is not communicated only through color;
- reduced-motion behavior is respected.

See `docs/accessibility.md`.

## Security and privacy checklist

Before opening a pull request, ask:

- Can this input be controlled by a document, filename, path, URL, backup, or user action?
- Is output encoded/sanitized for its destination?
- Did permissions become broader?
- Could any content/path/token reach logs?
- Does this introduce an automatic network request?
- Does persistence have a version and validation boundary?
- Are destructive writes bounded and recoverable where practical?

## Documentation

Update the relevant documentation with behavior changes. Significant work should also update `CHANGELOG.md` and `what_changed.md`. Architecture decisions with long-term consequences belong in `docs/adr/`.

## Pull requests

A good pull request:

- explains the user or engineering problem;
- contains one coherent change;
- lists verification actually performed;
- includes screenshots for meaningful visual changes;
- calls out security, privacy, migration, or compatibility implications;
- does not claim checks passed unless they were run.

The pull request template contains the required review checklist.

## License

By contributing, you agree that your contribution may be distributed under Markora's MIT License.

## Contact

- Project GitHub: https://github.com/sanskarIN
- Business: sanskarin@outlook.in
- Support: supportramsandesh@gmail.com

**Made by the Sanskar**
