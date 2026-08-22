import { useMemo, useState } from 'react';

import { BUILT_IN_EXPORT_TEMPLATES, exportTemplatePatch } from '../lib/exportTemplates';
import type { EditorSettings } from '../types';

interface ExportTemplatePickerProps {
  onUpdate: (patch: Partial<EditorSettings>) => void;
}

export function ExportTemplatePicker({ onUpdate }: ExportTemplatePickerProps) {
  const [selectedId, setSelectedId] = useState(BUILT_IN_EXPORT_TEMPLATES[0]!.id);
  const template = useMemo(
    () => BUILT_IN_EXPORT_TEMPLATES.find((candidate) => candidate.id === selectedId) ?? BUILT_IN_EXPORT_TEMPLATES[0]!,
    [selectedId],
  );

  return (
    <div className="settings-fields" aria-label="Export templates">
      <label className="setting-row">
        <span>Export template</span>
        <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
          {BUILT_IN_EXPORT_TEMPLATES.map((candidate) => (
            <option key={candidate.id} value={candidate.id}>
              {candidate.name}
            </option>
          ))}
        </select>
      </label>
      <div className="button-row">
        <button type="button" onClick={() => onUpdate(exportTemplatePatch(template))}>
          Apply template
        </button>
      </div>
      <p className="settings-note">
        Templates use a versioned, validated configuration and only change print/export preferences.
      </p>
    </div>
  );
}
