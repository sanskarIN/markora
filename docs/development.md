# Markora development workflow

Markora is organized as a local-first desktop monolith. Keep UI/domain logic testable in TypeScript and keep privileged filesystem/external-link operations behind the narrow Rust/Tauri command boundary.

## Working branches

Create a focused branch for non-trivial changes when contributing through pull requests:

```bash
git switch -c feat/short-description
```

Use small Conventional Commit-style messages such as:

```text
feat: add outline search
fix: protect autosave from disk conflicts
test: cover recovery migration
docs: document release verification
```

Do not split a change so aggressively that intermediate commits cannot build or represent a coherent state.

## Frontend development

Start the browser development server:

```bash
npm run dev
```

Useful frontend commands:

```bash
npm run format
npm run format:check
npm run lint
npm run typecheck
npm test
npm run test:watch
npm run test:coverage
npm run build
```

### Frontend responsibilities

- `src/components/` contains presentation and interaction components.
- `src/hooks/` coordinates workspace behavior and persisted UI state.
- `src/lib/document.ts` contains document-domain utilities.
- `src/lib/editorCommands.ts` contains structural Markdown transformations.
- `src/lib/markdown.tsx` owns sanitized preview/export rendering.
- `src/lib/storage.ts` validates and migrates local recovery/backup data.
- `src/lib/platform.ts` is the browser/native adapter boundary.
- `src/lib/security.ts` contains frontend URL safety rules.
- `src/lib/logging.ts` redacts sensitive values before structured logs.

Prefer pure helpers for parsing, transformations, normalization, statistics, and generated styles so they can be tested without mounting the full app.

## Desktop development

Run the Tauri app:

```bash
npm run icons
npm run tauri:dev
```

Native code lives under `src-tauri/`. Custom commands should:

1. Validate user-controlled paths, extensions, file types, sizes, and URL schemes.
2. Avoid returning raw operating-system details that are not needed by the UI.
3. Keep document contents out of logs.
4. Prefer atomic replacement for writes where practical.
5. Return actionable but non-sensitive errors.
6. Add a Rust regression test for validation/security behavior when practical.

## Adding settings

Persisted editor settings are part of the version-1 workspace snapshot. When adding a setting:

1. Add its type and default in `src/types.ts`.
2. Normalize/migrate it in `src/lib/storage.ts`.
3. Add focused tests for missing, invalid, or out-of-range legacy data.
4. Add the UI in Settings or another appropriate surface.
5. Avoid invalidating existing `markora.workspace.v1` data when a default can migrate it safely.

## Markdown rendering changes

Treat Markdown as untrusted input. Preserve these guarantees:

- Raw HTML must not become executable preview HTML.
- Unsafe URL schemes remain blocked.
- Remote Markdown images must not load automatically.
- Exported HTML remains sanitized and self-contained.
- Heading identifiers use a predictable clobber-safe prefix.

Any sanitizer/schema change should include a regression test in `src/lib/markdown.test.tsx` or the relevant component test.

## File and recovery changes

Protect user writing before optimizing convenience. File-backed autosave currently uses disk fingerprints to detect external changes. Recovered dirty path-backed tabs are intentionally treated as unverified until the user explicitly saves/reconciles them.

Do not remove conflict checks merely to make autosave more aggressive.

## Accessibility expectations

For every interactive feature:

- use native controls where possible;
- preserve visible focus;
- provide accessible labels/names;
- ensure keyboard reachability;
- do not rely on color alone;
- respect reduced-motion behavior;
- verify modal focus/escape behavior when dialogs change.

See `docs/accessibility.md`.

## Before opening a pull request

Run:

```bash
npm run quality
npx playwright install chromium
npm run test:e2e
cargo fmt --manifest-path src-tauri/Cargo.toml --all -- --check
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml --all-features
```

Then review the diff for accidentally committed documents, secrets, generated junk, absolute local paths, or debug logging.

## Documentation continuity

Update `what_changed.md` when a development session materially changes implementation state, verification status, known limitations, or the exact next tasks. Update `ROADMAP.md` only when an item is truly implemented or priorities have intentionally changed.
