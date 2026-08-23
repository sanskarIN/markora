import { useState } from 'react';

import { useI18n } from '../i18n';
import type { TranslationKey } from '../i18n/en';
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

const ACTION_LABEL_KEYS: Record<ShortcutActionId, TranslationKey> = {
  new: 'newDocument',
  open: 'openMarkdownFile',
  save: 'saveDocument',
  saveAs: 'saveDocumentAs',
  find: 'findReplace',
  palette: 'commandPalette',
  settings: 'settings',
  bold: 'bold',
  italic: 'italic',
};

export function ShortcutSettings() {
  const { t } = useI18n();
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
      setError(t('shortcutNeedsModifier'));
      return;
    }

    try {
      const next = saveShortcutBinding(actionId, binding);
      setPreferences(next);
      setEditing(null);
      setError('');
    } catch (saveError: unknown) {
      const message = saveError instanceof Error ? saveError.message : '';
      if (message === 'Use Ctrl/Command plus a non-modifier key.') {
        setError(t('shortcutNeedsModifier'));
        return;
      }

      const conflict = SHORTCUT_ACTIONS.find(
        (action) => message === `That shortcut is already assigned to ${action.label}.`,
      );
      setError(
        conflict
          ? t('shortcutInUse', { action: t(ACTION_LABEL_KEYS[conflict.id]) })
          : t('shortcutSaveFailed'),
      );
    }
  };

  return (
    <div className="settings-fields" aria-label={t('keyboardShortcuts')}>
      <p className="settings-note">{t('shortcutInstructions')}</p>
      {SHORTCUT_ACTIONS.map((action) => (
        <div className="setting-row" key={action.id}>
          <span>{t(ACTION_LABEL_KEYS[action.id])}</span>
          <button
            type="button"
            aria-pressed={editing === action.id}
            onClick={() => {
              setEditing(action.id);
              setError('');
            }}
            onKeyDown={(event) => capture(action.id, event)}
          >
            {editing === action.id ? t('pressShortcut') : formatShortcutList(preferences, action.id)}
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
          {t('resetKeyboardShortcuts')}
        </button>
      </div>
      {error ? <p className="settings-note" role="alert">{error}</p> : null}
    </div>
  );
}
