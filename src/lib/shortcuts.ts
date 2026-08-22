export type ShortcutActionId =
  | 'new'
  | 'open'
  | 'save'
  | 'saveAs'
  | 'find'
  | 'palette'
  | 'settings'
  | 'bold'
  | 'italic';

export interface ShortcutBinding {
  key: string;
  shift: boolean;
  alt: boolean;
}

export interface ShortcutPreferencesV1 {
  version: 1;
  bindings: Record<ShortcutActionId, ShortcutBinding[]>;
}

export const SHORTCUT_ACTIONS: readonly { id: ShortcutActionId; label: string }[] = [
  { id: 'new', label: 'New document' },
  { id: 'open', label: 'Open Markdown file' },
  { id: 'save', label: 'Save document' },
  { id: 'saveAs', label: 'Save document as' },
  { id: 'find', label: 'Find and replace' },
  { id: 'palette', label: 'Command palette' },
  { id: 'settings', label: 'Settings' },
  { id: 'bold', label: 'Bold' },
  { id: 'italic', label: 'Italic' },
] as const;

export const DEFAULT_SHORTCUTS: ShortcutPreferencesV1 = {
  version: 1,
  bindings: {
    new: [{ key: 'n', shift: false, alt: false }],
    open: [{ key: 'o', shift: false, alt: false }],
    save: [{ key: 's', shift: false, alt: false }],
    saveAs: [{ key: 's', shift: true, alt: false }],
    find: [{ key: 'f', shift: false, alt: false }],
    palette: [
      { key: 'k', shift: false, alt: false },
      { key: 'p', shift: true, alt: false },
    ],
    settings: [{ key: ',', shift: false, alt: false }],
    bold: [{ key: 'b', shift: false, alt: false }],
    italic: [{ key: 'i', shift: false, alt: false }],
  },
};

const SHORTCUTS_KEY = 'markora.shortcuts.v1';
const SHORTCUTS_CHANGED_EVENT = 'markora:shortcuts-changed';

export function loadShortcutPreferences(): ShortcutPreferencesV1 {
  if (typeof localStorage === 'undefined') return cloneDefaults();
  try {
    const raw = localStorage.getItem(SHORTCUTS_KEY);
    if (!raw || new Blob([raw]).size > 32 * 1024) return cloneDefaults();
    return normalizeShortcutPreferences(JSON.parse(raw));
  } catch {
    return cloneDefaults();
  }
}

export function saveShortcutBinding(
  actionId: ShortcutActionId,
  binding: ShortcutBinding,
): ShortcutPreferencesV1 {
  const normalizedBinding = normalizeBinding(binding);
  if (!normalizedBinding) throw new Error('Use Ctrl/Command plus a non-modifier key.');

  const current = loadShortcutPreferences();
  for (const action of SHORTCUT_ACTIONS) {
    if (action.id === actionId) continue;
    if (current.bindings[action.id].some((candidate) => sameBinding(candidate, normalizedBinding))) {
      throw new Error(`That shortcut is already assigned to ${action.label}.`);
    }
  }

  const next: ShortcutPreferencesV1 = {
    version: 1,
    bindings: { ...current.bindings, [actionId]: [normalizedBinding] },
  };
  persistShortcutPreferences(next);
  return next;
}

export function resetShortcutPreferences(): ShortcutPreferencesV1 {
  const defaults = cloneDefaults();
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem(SHORTCUTS_KEY);
    } catch {
      // Defaults remain usable even when optional persistence is unavailable.
    }
  }
  announceShortcutChange();
  return defaults;
}

export function eventMatchesShortcut(
  event: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'shiftKey' | 'altKey'>,
  preferences: ShortcutPreferencesV1,
  actionId: ShortcutActionId,
): boolean {
  if (!event.ctrlKey && !event.metaKey) return false;
  const key = normalizeKey(event.key);
  return preferences.bindings[actionId].some(
    (binding) =>
      binding.key === key &&
      binding.shift === event.shiftKey &&
      binding.alt === event.altKey,
  );
}

export function bindingFromKeyboardEvent(
  event: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'shiftKey' | 'altKey'>,
): ShortcutBinding | null {
  if (!event.ctrlKey && !event.metaKey) return null;
  const key = normalizeKey(event.key);
  if (!key || isModifierKey(key)) return null;
  return { key, shift: event.shiftKey, alt: event.altKey };
}

export function formatShortcut(binding: ShortcutBinding): string {
  const modifiers = ['Ctrl/⌘'];
  if (binding.alt) modifiers.push('Alt');
  if (binding.shift) modifiers.push('Shift');
  modifiers.push(formatKey(binding.key));
  return modifiers.join(' ');
}

export function formatShortcutList(preferences: ShortcutPreferencesV1, actionId: ShortcutActionId): string {
  return preferences.bindings[actionId].map(formatShortcut).join(' / ');
}

export function shortcutChangeEventName(): string {
  return SHORTCUTS_CHANGED_EVENT;
}

function persistShortcutPreferences(preferences: ShortcutPreferencesV1): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(SHORTCUTS_KEY, JSON.stringify(preferences));
  } catch {
    throw new Error('Could not save keyboard shortcuts locally.');
  }
  announceShortcutChange();
}

function announceShortcutChange(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(SHORTCUTS_CHANGED_EVENT));
}

function normalizeShortcutPreferences(value: unknown): ShortcutPreferencesV1 {
  if (!isRecord(value) || value.version !== 1 || !isRecord(value.bindings)) return cloneDefaults();

  const bindings = {} as ShortcutPreferencesV1['bindings'];
  for (const action of SHORTCUT_ACTIONS) {
    const rawBindings = value.bindings[action.id];
    if (!Array.isArray(rawBindings)) {
      bindings[action.id] = cloneBindings(DEFAULT_SHORTCUTS.bindings[action.id]);
      continue;
    }
    const normalized = rawBindings.flatMap((binding) => {
      const result = normalizeBinding(binding);
      return result ? [result] : [];
    }).slice(0, 3);
    bindings[action.id] = normalized.length
      ? normalized
      : cloneBindings(DEFAULT_SHORTCUTS.bindings[action.id]);
  }
  return { version: 1, bindings };
}

function normalizeBinding(value: unknown): ShortcutBinding | null {
  if (!isRecord(value)) return null;
  const key = normalizeKey(value.key);
  if (!key || isModifierKey(key) || key.length > 24) return null;
  return {
    key,
    shift: typeof value.shift === 'boolean' ? value.shift : false,
    alt: typeof value.alt === 'boolean' ? value.alt : false,
  };
}

function normalizeKey(value: unknown): string {
  if (typeof value !== 'string') return '';
  const key = value.trim();
  return key.length === 1 ? key.toLocaleLowerCase() : key;
}

function isModifierKey(key: string): boolean {
  return ['Control', 'Meta', 'Shift', 'Alt', 'AltGraph'].includes(key);
}

function sameBinding(left: ShortcutBinding, right: ShortcutBinding): boolean {
  return left.key === right.key && left.shift === right.shift && left.alt === right.alt;
}

function formatKey(key: string): string {
  if (key === ',') return ',';
  if (key === ' ') return 'Space';
  return key.length === 1 ? key.toLocaleUpperCase() : key;
}

function cloneBindings(bindings: ShortcutBinding[]): ShortcutBinding[] {
  return bindings.map((binding) => ({ ...binding }));
}

function cloneDefaults(): ShortcutPreferencesV1 {
  return {
    version: 1,
    bindings: Object.fromEntries(
      SHORTCUT_ACTIONS.map((action) => [action.id, cloneBindings(DEFAULT_SHORTCUTS.bindings[action.id])]),
    ) as ShortcutPreferencesV1['bindings'],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
