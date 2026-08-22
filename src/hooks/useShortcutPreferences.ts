import { useEffect, useState } from 'react';

import {
  loadShortcutPreferences,
  shortcutChangeEventName,
  type ShortcutPreferencesV1,
} from '../lib/shortcuts';

export function useShortcutPreferences(): ShortcutPreferencesV1 {
  const [preferences, setPreferences] = useState<ShortcutPreferencesV1>(() => loadShortcutPreferences());

  useEffect(() => {
    const reload = () => setPreferences(loadShortcutPreferences());
    window.addEventListener(shortcutChangeEventName(), reload);
    window.addEventListener('storage', reload);
    return () => {
      window.removeEventListener(shortcutChangeEventName(), reload);
      window.removeEventListener('storage', reload);
    };
  }, []);

  return preferences;
}
