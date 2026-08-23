# Markora accessibility

Accessibility is a release requirement for Markora, not a post-release enhancement. The editor is designed around native controls, keyboard operation, visible focus, readable contrast, reduced-motion behavior, forced-colors compatibility, and Unicode-safe document handling.

## Current accessibility baseline

Implemented behavior includes:

- semantic buttons, inputs, selects, navigation, dialogs, and regions;
- accessible names for primary controls and icon-only close actions;
- keyboard shortcuts for common file/edit actions;
- visible `:focus-visible` indicators;
- automated checks for unnamed interactive controls and duplicate element IDs;
- forced-colors/high-contrast focus and active-state treatment;
- non-color-only dirty/status text;
- reduced-motion preference support;
- responsive layouts for narrow windows;
- heading-based navigation and breadcrumbs;
- status/toast text for success, warning, and error outcomes;
- automatic bidi direction for the editor and preview;
- complex-script regression coverage for Devanagari, Arabic, Hebrew, combining marks, and emoji.

## Keyboard smoke test

Without using a mouse, verify that a user can:

1. move through toolbar controls with Tab/Shift+Tab;
2. create, open, save, and save-as a document;
3. move between document tabs and close a tab;
4. open Find/Replace and operate its controls;
5. open the command palette and execute an action;
6. open Settings, modify a control, and dismiss the dialog;
7. reach outline/recent/statistics sidebar controls;
8. enter and leave distraction-free mode;
9. use the Markdown editor without focus being trapped elsewhere.

Expected shortcuts include Ctrl/Command variants for New, Open, Save, Find, Settings, Bold, Italic, and the command palette where implemented. Shortcut remapping must preserve keyboard-only operation.

## Focus behavior

Focus indicators must remain visible in every theme and in Windows forced-colors mode. Do not globally remove outlines. If a custom component needs focus styling, use `:focus-visible` and ensure the indicator has sufficient separation from the component border/background.

Dialogs and overlays must be dismissible and must not leave the rest of the application permanently unreachable after closing.

## Screen-reader and manual release matrix

Automated browser checks do **not** count as screen-reader verification. The matrix below is the required packaged-build release checklist. Status stays **Pending** until the named assistive-technology run has actually been performed on a packaged build for the release candidate.

| Platform | Assistive technology | Required release scenarios | Status |
| --- | --- | --- | --- |
| Windows 11 | Narrator | Launch/purpose, toolbar names, document tabs, editor/preview regions, Find/Replace, Settings labels/states, toast announcements, keyboard-only close/escape flows | Pending packaged-build verification |
| Windows 11 | NVDA | Same core scenarios plus browse/focus-mode transitions around preview content and heading navigation | Pending packaged-build verification |
| macOS | VoiceOver | Launch/purpose, toolbar, tabs, editor/preview regions, dialogs, settings controls, status announcements, keyboard navigation | Pending packaged-build verification |
| Linux desktop | Orca | Launch/purpose, toolbar, tabs, editor/preview regions, dialogs, settings controls, status announcements where the target AT-SPI stack supports the packaged build | Pending packaged-build verification |
| Windows 11 High Contrast | Narrator or NVDA | Forced-colors focus visibility, selected tab/command state, warnings, disabled controls, editor/preview readability | Pending packaged-build verification |

For every row, record the Markora commit/version, OS build, assistive-technology version, pass/fail result, and defect links before changing the status. Do not mark a row verified from code inspection or browser automation alone.

### Required announcements and semantics

Verify that:

- window/application purpose is understandable;
- toolbar actions have names;
- tab titles and active state are understandable;
- editor and preview regions have useful labels;
- settings fields announce labels and current values;
- switch/checkbox states are announced;
- command-palette options expose selected state;
- warnings/errors are available as text rather than only visual decoration;
- locale changes do not remove accessible names;
- mixed RTL/LTR document content does not make surrounding application controls unusable.

## Reduced motion

Markora exposes a Reduce motion setting. When enabled, transitions/animations should become effectively instantaneous and smooth-scrolling behavior should not force motion.

New animations must have a reduced-motion path and should not block editing or navigation.

## Contrast, forced colors, and themes

Graphite, Aurora, and Paper themes must preserve readable text, borders, controls, focus rings, warnings, and disabled states in both light and dark modes. `src/accessibility.css` adds a dedicated `forced-colors: active` path using system colors rather than relying on authored RGB values.

When changing colors, test:

- primary text against surfaces;
- muted text used for meaningful labels;
- focus rings;
- links;
- warning/error/success text or borders;
- selected/active tabs and command items;
- native controls in Windows High Contrast/forced-colors mode.

Do not communicate a dirty document, error, selection, or active state solely through hue.

## Zoom and narrow windows

The app should remain usable at narrow widths and normal browser/webview zoom levels. Check:

- no inaccessible off-screen dialog actions;
- settings sections stack instead of becoming too narrow;
- the preview-only layout stays visible on narrow screens;
- the editor remains the primary visible surface when responsive rules collapse optional panels;
- text can wrap without horizontal clipping except where deliberate code/no-wrap behavior is selected.

## Content and international text

Markdown may contain Unicode, emoji, right-to-left text, combining marks, and complex scripts. Do not assume one character equals one byte or one visual glyph. Avoid transformations that corrupt Unicode boundaries.

The regression fixture at `e2e/fixtures/bidi-complex.md` covers Devanagari, Arabic, Hebrew, mixed currency/identifiers, combining marks, emoji, tables, block quotes, and code. The editor and live preview use `dir="auto"`, while prose/table cells use `unicode-bidi: plaintext` and logical CSS properties where direction-sensitive layout matters.

When adding a new locale or script family, extend this fixture rather than replacing existing cases.

## Automated checks

Automated tests can detect only part of accessibility quality. Markora currently includes:

- `e2e/accessibility.spec.ts` for accessible-name checks, duplicate IDs, keyboard order, dialog naming/Escape behavior, and forced-colors focus visibility;
- `e2e/i18n.spec.ts` for locale persistence and mixed-script editor/preview behavior;
- role/name based queries across the main editor E2E suite;
- component tests that render through the same locale provider used by the application.

These checks are regression aids, not proof of complete conformance. Manual keyboard and assistive-technology verification remains required for release candidates.

## Reporting accessibility defects

Accessibility issues are welcome in the public issue tracker when they do not expose private data. Include:

- OS and assistive technology/version;
- Markora version/commit;
- keyboard or screen-reader steps;
- expected announcement/interaction;
- actual announcement/interaction.

Do not include private Markdown content in reproduction material.
