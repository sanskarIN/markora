import { useEffect, useState } from 'react';

import type { LayoutMode } from '../lib/layout';
import {
  deleteSessionPreset,
  loadSessionPresets,
  saveSessionPreset,
  type SessionPresetV1,
} from '../lib/sessionPresets';
import type { EditorSettings } from '../types';

interface SessionPresetManagerProps {
  settings: EditorSettings;
  layoutMode: LayoutMode;
  editorPanePercent: number;
  onUpdateSettings: (patch: Partial<EditorSettings>) => void;
  onLayoutModeChange: (mode: LayoutMode) => void;
  onEditorPanePercentChange: (percent: number) => void;
}

export function SessionPresetManager({
  settings,
  layoutMode,
  editorPanePercent,
  onUpdateSettings,
  onLayoutModeChange,
  onEditorPanePercentChange,
}: SessionPresetManagerProps) {
  const [name, setName] = useState('');
  const [presets, setPresets] = useState<SessionPresetV1[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const loaded = loadSessionPresets();
    setPresets(loaded);
    setSelectedId((current) => current || loaded[0]?.id || '');
  }, []);

  const selected = presets.find((preset) => preset.id === selectedId) ?? null;

  const handleSave = () => {
    try {
      const next = saveSessionPreset(name, settings, {
        version: 1,
        mode: layoutMode,
        editorPanePercent,
      });
      setPresets(next);
      setSelectedId(next[0]?.id ?? '');
      setName('');
      setError('');
    } catch (saveError: unknown) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save the session preset.');
    }
  };

  const handleApply = () => {
    if (!selected) return;
    onUpdateSettings(selected.settings);
    onLayoutModeChange(selected.layout.mode);
    onEditorPanePercentChange(selected.layout.editorPanePercent);
    setError('');
  };

  const handleDelete = () => {
    if (!selected) return;
    const next = deleteSessionPreset(selected.id);
    setPresets(next);
    setSelectedId(next[0]?.id ?? '');
    setError('');
  };

  return (
    <div className="settings-fields" aria-label="Session presets">
      <label className="setting-row">
        <span>Preset name</span>
        <input
          type="text"
          value={name}
          maxLength={48}
          placeholder="e.g. Focus writing"
          onChange={(event) => setName(event.target.value)}
          style={{
            width: '100%',
            minHeight: 34,
            padding: '5px 8px',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--surface-2)',
            color: 'var(--text)',
          }}
        />
      </label>
      <div className="button-row">
        <button type="button" disabled={!name.trim()} onClick={handleSave}>
          Save current session preset
        </button>
      </div>

      <label className="setting-row">
        <span>Saved preset</span>
        <select
          value={selectedId}
          disabled={presets.length === 0}
          onChange={(event) => setSelectedId(event.target.value)}
        >
          {presets.length === 0 ? <option value="">No saved presets</option> : null}
          {presets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.name}
            </option>
          ))}
        </select>
      </label>
      <div className="button-row">
        <button type="button" disabled={!selected} onClick={handleApply}>
          Apply preset
        </button>
        <button type="button" disabled={!selected} onClick={handleDelete}>
          Delete preset
        </button>
      </div>
      {error ? <p className="settings-note" role="alert">{error}</p> : null}
      <p className="settings-note">
        Presets stay on this device and contain preferences/layout only. Document contents are never stored in a preset.
      </p>
    </div>
  );
}
