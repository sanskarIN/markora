import { useCallback, useEffect, useState } from 'react';

import {
  clampEditorPanePercent,
  loadLayoutPreferences,
  resetLayoutPreferences,
  saveLayoutPreferences,
  type LayoutMode,
  type LayoutPreferences,
} from '../lib/layout';

export function useLayoutPreferences() {
  const [layout, setLayout] = useState<LayoutPreferences>(loadLayoutPreferences);

  useEffect(() => {
    saveLayoutPreferences(layout);
  }, [layout]);

  const setMode = useCallback((mode: LayoutMode) => {
    setLayout((current) => ({ ...current, mode }));
  }, []);

  const setEditorPanePercent = useCallback((editorPanePercent: number) => {
    setLayout((current) => ({
      ...current,
      editorPanePercent: clampEditorPanePercent(editorPanePercent),
    }));
  }, []);

  const resetLayout = useCallback(() => {
    setLayout(resetLayoutPreferences());
  }, []);

  return {
    layout,
    setMode,
    setEditorPanePercent,
    resetLayout,
  };
}
