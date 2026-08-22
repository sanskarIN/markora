import { useState } from 'react';

import {
  bindingFromKeyboardEvent,
  formatShortcutList,
  loadShortcutPreferences,
  resetShortcutPreferences,
  saveShortcutBinding,
  SHORTCUT_ACTIONS,
  type ShortcutActionId,
  type ShortcutPreferencesV1,
} from '../lib/shortcuts';

export function ShortcutSettings() {
  const [preferences, setPreferences] = useState<ShortcutPreferencesV1>(() => loadShortcutPreferences());
  const [editing, setEditing] = useState<ShortcutActionId | null>(null);
  const [error, setError] = useState('');

  const capture = (actionId: ShortcutActionId, event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (editing !== actionId) return;
    event.preventDefault();
    event.stopPropagation();

    if (event.key === 'Escape') {
      setEditing(null);
      setError('');
      return;
    }

    const binding = bindingFromKeyboardEvent(event.nativeEvent);
    if (!binding) {
      setError('Press Ctrl/Command plus a non-modifier key. Shift and Alt are optional.');
      return;
    }

    try {
      const next = saveShortcutBinding(actionId, binding);
      setPreferences(next);
      setEditing(null);
      setError('');
    } catch (saveError: unknown) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save that shortcut.');
    }
  };

  return (
    <div className="settings-fields" aria-label="Keyboard shortcut configuration">
      <p className="settings-note">
        Select a shortcut button, then press Ctrl/Command plus a key. Shift and Alt are optional. Duplicate bindings are rejected.
      </p>
      {SHORTCUT_ACTIONS.map((action) => (
        <div className="setting-row" key={action.id}>
          <span>{action.label}</span>
          <button
            type="button"
            aria-pressed={editing === action.id}
            onClick={() => {
              setEditing(action.id);
              setError('');
            }}
            onKeyDown={(event) => capture(action.id, event)}
          >
            {editing === action.id ? 'Press shortcut…' : formatShortcutList(preferences, action.id)}
          </button>
        </div>
      ))}
      <div className="button-row">
        <button
          type="button"
          onClick={() => {
            setPreferences(resetShortcutPreferences());
            setEditing(null);
            setError('');
          }}
        >
          Reset keyboard shortcuts
        </button>
      </div>
      {error ? <p className="settings-note" role="alert">{error}</p> : null}
    </div>
  );
}
