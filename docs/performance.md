# Markora performance

Markora keeps the editing path local and deliberately avoids network work. Performance changes are measured against representative, synthetic documents instead of justified by intuition alone.

## Performance goals

For normal Markdown documents on a supported desktop system, Markora should:

- accept typing without visible input lag;
- update preview/navigation quickly enough to preserve writing flow;
- keep tab switching immediate;
- avoid unbounded memory growth as documents are opened/closed;
- keep recovery/autosave work off the critical keystroke path;
- avoid unnecessary filesystem or network work while typing.

These are product goals rather than guarantees for arbitrarily large files or extremely slow hardware.

## Automated release regression budgets

The repository now includes deliberately conservative CI tripwires. They are intended to catch major regressions across shared runners rather than act as a hardware-independent SLA.

| Measurement | Automated budget | Coverage |
| --- | ---: | --- |
| Frontend DOM startup to interactive editor | `< 7,000 ms` | `e2e/performance.spec.ts` |
| Medium synthetic Markdown fill to final preview heading | `< 4,000 ms` | `e2e/performance.spec.ts` |
| Filtering a 1,200-heading outline to a target heading | `< 2,000 ms` | `e2e/performance.spec.ts` |
| Production `dist/` size | `<= 3 MiB` | `scripts/check-web-bundle-size.mjs` |

A budget failure should trigger investigation before increasing the threshold. If runner noise is proven to be the cause, document the evidence before changing the budget.

The browser timings include React/webview work and Playwright interaction overhead. They intentionally do not claim native package startup latency because a packaged Tauri executable must be measured on the actual target OS.

## Existing safeguards

The current architecture includes several bounded behaviors:

- native Markdown reads enforce a maximum file size;
- workspace recovery has a serialized storage-size limit;
- recent-file lists and tab counts are bounded;
- drag-and-drop opens only a bounded number of items;
- outline rendering/search includes large-document handling;
- autosave is delayed/debounced rather than writing on every keystroke;
- preview images are not fetched remotely;
- no analytics/background synchronization pipeline runs while editing;
- the production web bundle has an automated size ceiling.

## Representative fixtures

Performance testing should include at least:

1. **Small note** — a few hundred words, headings, lists, links.
2. **Medium document** — tens of thousands of characters with links, lists, and inline formatting.
3. **Large outline document** — hundreds/thousands of headings to stress navigation/search.
4. **Code-heavy document** — many fenced blocks to stress highlighting/rendering.
5. **Long-line document** — large code/text lines to test wrapping and editor scrolling.

Only synthetic/non-sensitive fixture content should be committed to automated tests.

## What to measure manually for a release candidate

For frontend profiling, capture:

- keystroke-to-render latency;
- preview render duration;
- heading/statistics computation time;
- command/find responsiveness;
- tab switch render time;
- JS heap trend after repeated open/close cycles.

For native operations, capture:

- packaged-app startup to usable editor;
- bounded read duration by file size;
- save/atomic replacement duration;
- fingerprint check duration;
- installer/package size.

Record the device, CPU/RAM class, OS version, architecture, build mode, fixture size, and commit SHA with manual results. Do not compare measurements from materially different machines as though they were identical benchmarks.

## Profiling workflow

Use a production-like frontend build when comparing regressions:

```bash
npm run build
npm run size:check
npm run preview
```

Run the automated browser budgets with:

```bash
npm run test:e2e -- e2e/performance.spec.ts
```

For desktop-specific behavior:

```bash
npm run tauri:build
```

Use the browser/webview performance profiler for React/render work and normal OS timing/profiling tools for native operations.

## Optimization rules

- Measure before adding memoization, virtualization, workers, caches, or native complexity.
- Prefer pure linear-time parsing passes that can be shared instead of multiple nearly identical scans when profiling shows a real bottleneck.
- Do not weaken sanitization, file bounds, recovery checks, or conflict detection for speed.
- Do not introduce remote services/CDNs to improve local rendering performance.
- Keep cache invalidation explicit and testable.
- Avoid optimization changes that make editor transformations less undo-safe or predictable.

## Autosave and recovery

Autosave is intentionally delayed. A shorter delay increases filesystem churn; a very long delay reduces convenience. The setting is bounded and persisted.

External-change fingerprint checks and recovery safeguards may add filesystem metadata operations, but protecting external edits/data recovery takes priority over removing a small amount of save-path overhead.

## Markdown preview

Preview cost depends on Markdown length, GFM features, syntax highlighting, and React rendering. If preview profiling becomes a bottleneck, evaluate:

- debounced preview rendering;
- incremental or worker-assisted parsing only if sanitizer guarantees are preserved;
- narrower syntax-highlighting work;
- virtualization for exceptionally large rendered documents.

Do not bypass `rehype-sanitize` or safe URL handling as an optimization.

## Stable-release performance gate

Before publishing a stable release:

1. automated browser budgets and the production bundle budget must pass on the release commit;
2. packaged startup and package size must be recorded on each target OS during release-candidate smoke testing;
3. any material regression against the previous verified release must be explained in `what_changed.md` and fixed or explicitly accepted;
4. thresholds must not be raised only to make CI green.

The budgets in this document are regression guards, not a promise that every device will produce the same timings.
