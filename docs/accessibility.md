# Markora accessibility

Accessibility is a release requirement for Markora, not a post-release enhancement. The editor is designed around native controls, keyboard operation, visible focus, readable contrast, and reduced-motion behavior.

## Current accessibility baseline

Implemented behavior includes:

- semantic buttons, inputs, selects, navigation, dialogs, and regions;
- accessible names for primary controls and icon-only close actions;
- keyboard shortcuts for common file/edit actions;
- visible `:focus-visible` indicators;
- non-color-only dirty/status text;
- reduced-motion preference support;
- responsive layouts for narrow windows;
- heading-based navigation and breadcrumbs;
- status/toast text for success, warning, and error outcomes.

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

Expected shortcuts include Ctrl/Command variants for New, Open, Save, Find, Settings, Bold, Italic, and the command palette where implemented.

## Focus behavior

Focus indicators must remain visible in every theme. Do not globally remove outlines. If a custom component needs focus styling, use `:focus-visible` and ensure the indicator has sufficient separation from the component border/background.

Dialogs and overlays must be dismissible and must not leave the rest of the application permanently unreachable after closing.

## Screen-reader checks

Manual release testing should cover at least one commonly used screen reader on each primary desktop family when practical:

- Windows: Narrator or NVDA;
- macOS: VoiceOver;
- Linux: Orca where the target desktop stack supports it.

Verify:

- window/application purpose is understandable;
- toolbar actions have names;
- tab titles and active state are understandable;
- editor and preview regions have useful labels;
- settings fields announce labels and current values;
- switch/checkbox states are announced;
- warnings/errors are available as text rather than only visual decoration.

## Reduced motion

Markora exposes a Reduce motion setting. When enabled, transitions/animations should become effectively instantaneous and smooth-scrolling behavior should not force motion.

New animations must have a reduced-motion path and should not block editing or navigation.

## Contrast and themes

Graphite, Aurora, and Paper themes must preserve readable text, borders, controls, focus rings, warnings, and disabled states in both light and dark modes.

When changing colors, test:

- primary text against surfaces;
- muted text used for meaningful labels;
- focus rings;
- links;
- warning/error/success text or borders;
- selected/active tabs and command items.

Do not communicate a dirty document, error, or selection solely through hue.

## Zoom and narrow windows

The app should remain usable at narrow widths and normal browser/webview zoom levels. Check:

- no inaccessible off-screen dialog actions;
- settings sections stack instead of becoming too narrow;
- the preview-only layout stays visible on narrow screens;
- the editor remains the primary visible surface when responsive rules collapse optional panels;
- text can wrap without horizontal clipping except where deliberate code/no-wrap behavior is selected.

## Content and international text

Markdown may contain Unicode, emoji, right-to-left text, combining marks, and complex scripts. Do not assume one character equals one byte or one visual glyph. Avoid transformations that corrupt Unicode boundaries.

Bidirectional and complex-script regression fixtures are tracked as a roadmap item and should be expanded before v1.0.

## Automated checks

Automated tests can detect only part of accessibility quality. Component/E2E tests should prefer role/name queries, which helps catch missing semantics, but manual keyboard and assistive-technology verification is still required for releases.

If an automated accessibility scanner is added, keep it deterministic and treat it as a regression aid rather than proof of complete conformance.

## Reporting accessibility defects

Accessibility issues are welcome in the public issue tracker when they do not expose private data. Include:

- OS and assistive technology/version;
- Markora version/commit;
- keyboard or screen-reader steps;
- expected announcement/interaction;
- actual announcement/interaction.

Do not include private Markdown content in reproduction material.
