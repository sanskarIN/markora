# ADR-0001: Local-first desktop monolith

**Status:** Accepted

## Context

Markora is a desktop Markdown editor whose core value is fast private writing without an account, cloud dependency, or mandatory network connection. Splitting the product into hosted services would add authentication, data-transfer, operational, privacy, and failure modes that are unnecessary for the core editing workflow.

## Decision

Markora is implemented as a local-first desktop monolith:

- React/TypeScript provides the editor UI and local document-domain behavior.
- Tauri packages the web frontend into native Windows, macOS, and Linux applications.
- Rust exposes a narrow set of privileged native commands.
- Workspace recovery/preferences remain local.
- No account, analytics backend, collaboration server, or automatic document sync is required for core operation.

Browser mode exists for frontend development and uses deliberately limited browser-safe fallbacks rather than pretending to provide desktop path access.

## Consequences

### Benefits

- Core editing works offline.
- Documents are not uploaded simply to use the editor.
- Deployment and operational complexity remain small.
- Native capabilities can be isolated behind explicit commands.
- The product has fewer remote-service availability dependencies.

### Tradeoffs

- Cross-device synchronization is not provided by Markora itself.
- Collaboration requires external tooling/workflows.
- Desktop packaging must be verified separately across supported operating systems.
- Browser preview cannot reproduce every native filesystem workflow.

## Security and privacy

Local-first does not mean trusted-by-default. Local files, Markdown, paths, recovery data, and external URLs remain untrusted inputs and are validated/sanitized at their boundaries.

No future cloud feature should silently change the default expectation that user writing remains local unless the user explicitly chooses otherwise.

## Revisit when

Reconsider this decision only if a strongly justified product capability cannot be delivered safely/local-first and its account/network/data implications can be made explicit, optional, and maintainable.
