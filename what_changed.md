# Markora — Development Handoff

## Current milestone

**v0.1.0 / Phase 0 → Phase 6 implementation pass**

This file is the primary continuity record for Markora. The repository began with only an MIT `LICENSE`; the implementation is being built incrementally without replacing useful history.

## Source requirements

The implementation follows the uploaded `28_markora_master_prompt.md`: Rust + Tauri + React/TypeScript, Windows/macOS/Linux, public MIT-licensed source, local-first behavior, safe Markdown rendering, multiple tabs, autosave/recovery, outline/breadcrumbs, find/replace, export, themes, command palette, accessibility, security, CI, release automation, and complete documentation.

## Implementation plan

1. **Phase 0 — Foundation**
   - Add Node/TypeScript/Vite/Tauri configuration and repository hygiene.
   - Add security-conscious architecture records and project documentation baseline.
   - Add GitHub issue/PR templates, Dependabot, CI, CodeQL, and release workflow.
2. **Phase 1 — Core editor**
   - Build the typed document/workspace model.
   - Implement Markdown utilities, live editor, safe GFM preview, syntax highlighting, tabs, outline, breadcrumbs, find/replace, and word count.
   - Add native Rust commands for open/read/save/export/external links with validation.
3. **Phase 2 — Persistence and product UX**
   - Add recovery snapshots, autosave, recent files, settings, onboarding, themes, distraction-free mode, command palette, responsive layout, and About/support UI.
4. **Phase 3 — Hardening**
   - Add CSP, local-only privacy defaults, atomic writes, bounded file reads, URL scheme allow-listing, structured redacted logging, graceful errors, and print/PDF flow.
5. **Phase 4 — Verification**
   - Add unit/component/integration-style tests, E2E browser coverage, accessibility checks, and Rust regression tests.
6. **Phase 5 — Docs and release**
   - Complete README, support/security/privacy/contribution docs, setup/testing/release/troubleshooting/accessibility/performance docs, logo source, changelog, roadmap, and packaging metadata.
7. **Phase 6 — Audit**
   - Run every locally available check; inspect GitHub Actions after push; fix discovered defects; record any environment/tooling limitations precisely.

## Completed work

- Confirmed repository `sanskarIN/markora` exists, is public, and is writable.
- Confirmed the existing repository contains an MIT license and one initial commit.
- Reviewed the complete uploaded master prompt and converted it into the implementation plan above.

## Files/modules added or changed

- `what_changed.md` — created as the project continuity document.

## Tests added

None yet; test infrastructure is part of Phase 4 and feature-level tests will be added alongside implementation where practical.

## Commands/checks run

- Inspected the repository metadata and root contents through the connected GitHub account.
- Read the complete uploaded master prompt from the provided sandbox path.
- Local environment probe: Node.js `v22.16.0`, npm `10.9.2`, TypeScript `5.8.3`; Rust/Cargo is not installed in the execution sandbox.

## Known limitations

- The connected GitHub write API does not expose an author/committer-email field. The authenticated GitHub profile currently reports `supportramsandesh@gmail.com`; therefore commits made through this connector cannot be forced to use `sanskarin@outlook.in`. Repository configuration and documentation will use the requested project email, but commit identity is controlled by the GitHub connection.
- Rust/Cargo verification cannot run in the local execution sandbox because Cargo is not installed. GitHub Actions will be configured to perform Rust checks on hosted runners.
- Package installation from the local sandbox is currently timing out, so final frontend verification will rely on static review plus GitHub Actions unless package access becomes available.

## Open issues

- None filed yet. Any implementation defect found during verification will be fixed with a regression test where feasible.

## Next exact tasks

- Add project configuration and repository hygiene files.
- Add typed frontend architecture and native Tauri shell.
- Add feature modules and test coverage.
- Add CI/release/security configuration and full documentation.
- Revisit this file after every major milestone with exact commit/results data.

## Migration notes

No persisted production schema exists yet. Workspace/recovery data will be versioned from the first implementation.

## Release notes draft

### 0.1.0 — Initial production-quality preview

Planned: local-first Markdown editing, safe live preview, tabs, outline, search/replace, recovery/autosave, recent files, themes, command palette, HTML/PDF export flow, native desktop file operations, accessibility, tests, documentation, and automated quality/release workflows.

## Recent meaningful commits

- `e2d5831` — `Initial commit`
- Current commit — `docs: add development handoff plan`
