# Architecture Decision Records

Markora uses Architecture Decision Records (ADRs) for decisions that materially affect security, privacy, persistence, platform boundaries, or long-term maintainability.

## Status values

- **Accepted** — current architecture.
- **Superseded** — replaced by a later ADR; keep for historical context.
- **Proposed** — under discussion, not yet a repository guarantee.

## Records

- [ADR-0001 — Local-first desktop monolith](0001-local-first-desktop-monolith.md)
- [ADR-0002 — Sanitized Markdown rendering boundary](0002-sanitized-markdown-rendering.md)
- [ADR-0003 — Validated native file command boundary](0003-validated-native-file-boundary.md)
- [ADR-0004 — Versioned local recovery and conflict-safe autosave](0004-versioned-recovery-and-conflict-safety.md)

## Adding an ADR

Create a numbered Markdown file containing:

1. title and status;
2. context/problem;
3. decision;
4. consequences/tradeoffs;
5. security/privacy/accessibility implications where relevant;
6. conditions that would justify revisiting the decision.

Do not rewrite accepted ADR history to make a newer design look inevitable. Add a new ADR and mark the old one superseded when architecture changes materially.
