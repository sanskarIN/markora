# Markora performance

Markora keeps the editing path local and deliberately avoids network work. Performance changes should be measured against representative documents instead of justified by intuition alone.

## Performance goals

For normal Markdown documents on a supported desktop system, Markora should:

- accept typing without visible input lag;
- update preview/navigation quickly enough to preserve writing flow;
- keep tab switching immediate;
- avoid unbounded memory growth as documents are opened/closed;
- keep recovery/autosave work off the critical keystroke path;
- avoid unnecessary filesystem or network work while typing.

These are product goals rather than guarantees for arbitrarily large files or extremely slow hardware.

## Existing safeguards

The current architecture includes several bounded behaviors:

- native Markdown reads enforce a maximum file size;
- workspace recovery has a serialized storage-size limit;
- recent-file lists and tab counts are bounded;
- drag-and-drop opens only a bounded number of items;
- outline rendering/search includes large-document handling;
- autosave is delayed/debounced rather than writing on every keystroke;
- preview images are not fetched remotely;
- no analytics/background synchronization pipeline runs while editing.

## Representative fixtures

Performance testing should include at least:

1. **Small note** — a few hundred words, headings, lists, links.
2. **Medium document** — tens of thousands of characters with tables and fenced code.
3. **Large outline document** — hundreds/thousands of headings to stress navigation/search.
4. **Code-heavy document** — many fenced blocks to stress highlighting/rendering.
5. **Long-line document** — large code/text lines to test wrapping and editor scrolling.

Use synthetic/non-sensitive fixtures committed specifically for testing when appropriate.

## What to measure

For frontend profiling, capture:

- keystroke-to-render latency;
- preview render duration;
- heading/statistics computation time;
- command/find responsiveness;
- tab switch render time;
- JS heap trend after repeated open/close cycles.

For native operations, capture:

- bounded read duration by file size;
- save/atomic replacement duration;
- fingerprint check duration;
- startup/package size where changes affect dependencies.

## Profiling workflow

Use a production-like frontend build when comparing regressions:

```bash
npm run build
npm run preview
```

For desktop-specific behavior:

```bash
npm run tauri:build
```

Use the browser/webview performance profiler for React/render work and normal OS timing/profiling tools for native operations. Record the device, OS, build mode, fixture size, and commit SHA with results.

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

## Release performance gate

Before v1.0, record repeatable measurements for representative fixtures and define concrete regression thresholds for at least typing, preview rendering, large-outline navigation, startup, and package size. Until those measurements are recorded, avoid claiming a numerical performance SLA.

Any measured major regression should be documented in `what_changed.md` and fixed or explicitly accepted before a stable release.
