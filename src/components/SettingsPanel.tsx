import { useEffect, useState } from 'react';

import { getLocalFontStack, LOCAL_FONT_PRESETS } from '../lib/fonts';
import type { LayoutMode } from '../lib/layout';
import { getAppVersion } from '../lib/platform';
import { buildPrintStyle } from '../lib/print';
import type { DocumentTab, EditorSettings } from '../types';
import { ExportTemplatePicker } from './ExportTemplatePicker';
import { RecoveryInspector } from './RecoveryInspector';
import { SessionPresetManager } from './SessionPresetManager';
import { ShortcutSettings } from './ShortcutSettings';

interface SettingsPanelProps {
  open: boolean;
  settings: EditorSettings;
  tabs: DocumentTab[];
  activeId: string;
  layoutMode: LayoutMode;
  editorPanePercent: number;
  onUpdate: (patch: Partial<EditorSettings>) => void;
  onActivateTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onLayoutModeChange: (mode: LayoutMode) => void;
  onEditorPanePercentChange: (percent: number) => void;
  onResetLayout: () => void;
  onReloadActiveFromDisk: () => void;
  onExportBackup: () => void;
  onRestoreBackup: () => void;
  onResetWorkspace: () => void;
  onOpenLink: (url: string) => void | Promise<void>;
  onClose: () => void;
}

export function SettingsPanel({
  open,
  settings,
  tabs,
  activeId,
  layoutMode,
  editorPanePercent,
  onUpdate,
  onActivateTab,
  onCloseTab,
  onLayoutModeChange,
  onEditorPanePercentChange,
  onResetLayout,
  onReloadActiveFromDisk,
  onExportBackup,
  onRestoreBackup,
  onResetWorkspace,
  onOpenLink,
  onClose,
}: SettingsPanelProps) {
  const [version, setVersion] = useState('0.1.0');

  useEffect(() => {
    document.documentElement.style.setProperty('--writing-font', getLocalFontStack(settings.fontPreset));
  }, [settings.fontPreset]);

  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'markora-print-settings';
    style.textContent = buildPrintStyle(settings);
    document.head.append(style);
    return () => style.remove();
  }, [
    settings.printCodeWrap,
    settings.printKeepHeadings,
    settings.printMarginMm,
    settings.printMetadata,
    settings.printPageSize,
  ]);

  useEffect(() => {
    if (!open) return;
    void getAppVersion().then(setVersion).catch(() => setVersion('0.1.0'));
  }, [open]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="settings-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="settings-header">
          <div>
            <span className="pane-kicker">Preferences</span>
            <h2 id="settings-title">Settings</h2>
          </div>
          <button className="icon-close" type="button" onClick={onClose} aria-label="Close settings">
            ×
          </button>
        </header>

        <div className="settings-scroll">
          <SettingsSection title="Appearance" description="Tune Markora for the way you write.">
            <SettingRow label="Color mode">
              <select
                value={settings.themeMode}
                onChange={(event) =>
                  onUpdate({ themeMode: event.target.value as EditorSettings['themeMode'] })
                }
              >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </SettingRow>
            <SettingRow label="Editor theme">
              <select
                value={settings.editorTheme}
                onChange={(event) =>
                  onUpdate({ editorTheme: event.target.value as EditorSettings['editorTheme'] })
                }
              >
                <option value="graphite">Graphite</option>
                <option value="aurora">Aurora</option>
                <option value="paper">Paper</option>
              </select>
            </SettingRow>
            <SettingRow label="Writing font">
              <select
                value={settings.fontPreset}
                onChange={(event) =>
                  onUpdate({ fontPreset: event.target.value as EditorSettings['fontPreset'] })
                }
              >
                {LOCAL_FONT_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id} title={preset.description}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </SettingRow>
            <p className="settings-note">
              Writing fonts use local/system font stacks only. Markora never downloads a remote font.
            </p>
            <SettingRow label="Workspace layout">
              <select
                value={layoutMode}
                onChange={(event) => onLayoutModeChange(event.target.value as LayoutMode)}
              >
                <option value="split">Split editor and preview</option>
                <option value="editor">Editor only</option>
                <option value="preview">Preview only</option>
              </select>
            </SettingRow>
            <SettingRow label={`Editor share in split view — ${editorPanePercent}%`}>
              <input
                type="range"
                min="30"
                max="70"
                step="5"
                value={editorPanePercent}
                disabled={layoutMode !== 'split'}
                onChange={(event) => onEditorPanePercentChange(Number(event.target.value))}
              />
            </SettingRow>
            <button type="button" onClick={onResetLayout}>Reset layout</button>
            <SettingRow label={`Font size — ${settings.fontSize}px`}>
              <input
                type="range"
                min="12"
                max="28"
                step="1"
                value={settings.fontSize}
                onChange={(event) => onUpdate({ fontSize: Number(event.target.value) })}
              />
            </SettingRow>
            <SettingRow label={`Line height — ${settings.lineHeight.toFixed(2)}`}>
              <input
                type="range"
                min="1.2"
                max="2.2"
                step="0.05"
                value={settings.lineHeight}
                onChange={(event) => onUpdate({ lineHeight: Number(event.target.value) })}
              />
            </SettingRow>
            <Toggle label="Word wrap" checked={settings.wordWrap} onChange={(wordWrap) => onUpdate({ wordWrap })} />
            <Toggle
              label="Show outline"
              checked={settings.showOutline}
              onChange={(showOutline) => onUpdate({ showOutline })}
            />
            <Toggle
              label="Show preview in split layout"
              checked={settings.showPreview}
              onChange={(showPreview) => onUpdate({ showPreview })}
            />
          </SettingsSection>

          <SettingsSection
            title="Print & PDF"
            description="Control the operating-system print/PDF output without adding a network service."
          >
            <SettingRow label="Page size">
              <select
                value={settings.printPageSize}
                onChange={(event) =>
                  onUpdate({ printPageSize: event.target.value as EditorSettings['printPageSize'] })
                }
              >
                <option value="auto">Printer default</option>
                <option value="a4">A4</option>
                <option value="letter">US Letter</option>
              </select>
            </SettingRow>
            <SettingRow label={`Page margin — ${settings.printMarginMm} mm`}>
              <input
                type="range"
                min="5"
                max="35"
                step="1"
                value={settings.printMarginMm}
                onChange={(event) => onUpdate({ printMarginMm: Number(event.target.value) })}
              />
            </SettingRow>
            <Toggle
              label="Keep headings with following content"
              checked={settings.printKeepHeadings}
              onChange={(printKeepHeadings) => onUpdate({ printKeepHeadings })}
            />
            <Toggle
              label="Wrap long code lines"
              checked={settings.printCodeWrap}
              onChange={(printCodeWrap) => onUpdate({ printCodeWrap })}
            />
            <Toggle
              label="Include print metadata header"
              checked={settings.printMetadata}
              onChange={(printMetadata) => onUpdate({ printMetadata })}
            />
            <p className="settings-note">
              These options generate a bounded local print stylesheet. PDF creation still uses the system/browser print dialog.
            </p>
            <ExportTemplatePicker onUpdate={onUpdate} />
          </SettingsSection>

          <SettingsSection
            title="Workspace presets"
            description="Save named local preference/layout combinations for different writing workflows."
          >
            <SessionPresetManager
              settings={settings}
              layoutMode={layoutMode}
              editorPanePercent={editorPanePercent}
              onUpdateSettings={onUpdate}
              onLayoutModeChange={onLayoutModeChange}
              onEditorPanePercentChange={onEditorPanePercentChange}
            />
          </SettingsSection>

          <SettingsSection
            title="Keyboard shortcuts"
            description="Remap core Ctrl/Command shortcuts locally without changing command behavior."
          >
            <ShortcutSettings />
          </SettingsSection>

          <SettingsSection
            title="Privacy & data"
            description="Editing is local-first. Markora has no account requirement and no analytics pipeline."
          >
            <Toggle label="Autosave files that already have a path" checked={settings.autosave} onChange={(autosave) => onUpdate({ autosave })} />
            <SettingRow label={`Autosave delay — ${(settings.autosaveDelayMs / 1000).toFixed(1)}s`}>
              <input
                type="range"
                min="500"
                max="10000"
                step="250"
                value={settings.autosaveDelayMs}
                disabled={!settings.autosave}
                onChange={(event) => onUpdate({ autosaveDelayMs: Number(event.target.value) })}
              />
            </SettingRow>
            <div className="button-row">
              <button type="button" onClick={onReloadActiveFromDisk}>Reload active file from disk</button>
              <button type="button" onClick={onExportBackup}>Export workspace backup</button>
              <button type="button" onClick={onRestoreBackup}>Restore backup</button>
            </div>
            <p className="settings-note">
              Autosave pauses when Markora detects that a file changed outside the app. Recovered dirty disk files require one explicit save before autosave resumes.
            </p>
          </SettingsSection>

          <SettingsSection
            title="Recovery"
            description="Inspect the local workspace snapshot before removing recovered documents or resetting the session."
          >
            <RecoveryInspector
              tabs={tabs}
              activeId={activeId}
              onActivate={onActivateTab}
              onCloseTab={onCloseTab}
              onResetWorkspace={onResetWorkspace}
            />
          </SettingsSection>

          <SettingsSection title="Accessibility" description="Keyboard-first controls and readable motion defaults.">
            <Toggle
              label="Reduce motion"
              checked={settings.reducedMotion}
              onChange={(reducedMotion) => onUpdate({ reducedMotion })}
            />
            <p className="settings-note">
              All primary actions are keyboard reachable. Focus rings remain visible in every theme.
            </p>
          </SettingsSection>

          <SettingsSection title="Updates" description="Release builds are published through GitHub Releases.">
            <p className="settings-note">
              Markora does not silently install updates. Check release notes before replacing an installed build.
            </p>
            <button type="button" onClick={() => void onOpenLink('https://github.com/sanskarIN/markora/releases')}>
              Open releases
            </button>
          </SettingsSection>

          <SettingsSection title="About" description={`Markora ${version} · MIT License`}>
            <div className="about-card">
              <img src="/markora-logo.svg" alt="Markora logo" width="56" height="56" />
              <div>
                <strong>Markora</strong>
                <p>A secure, local-first Markdown editor for Windows, macOS, and Linux.</p>
                <b>Made by the Sanskar</b>
              </div>
            </div>
            <div className="about-links">
              <button type="button" onClick={() => void onOpenLink('https://github.com/sanskarIN')}>GitHub</button>
              <button type="button" onClick={() => void onOpenLink('https://buymeacoffee.com/sanskarIN')}>Buy Me a Coffee</button>
              <button type="button" onClick={() => void onOpenLink('mailto:sanskarin@outlook.in')}>Business email</button>
              <button type="button" onClick={() => void onOpenLink('mailto:sanskarin.business@gmail.com')}>Alternate business email</button>
              <button type="button" onClick={() => void onOpenLink('mailto:supportramsandesh@gmail.com')}>Support</button>
            </div>
          </SettingsSection>
        </div>
      </section>
    </div>
  );
}

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="settings-section">
      <header>
        <h3>{title}</h3>
        <p>{description}</p>
      </header>
      <div className="settings-fields">{children}</div>
    </section>
  );
}

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="setting-row">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="setting-row toggle-row">
      <span>{label}</span>
      <input type="checkbox" role="switch" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}
