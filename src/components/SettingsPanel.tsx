import { useEffect, useState } from 'react';

import type { EditorSettings } from '../types';
import { getAppVersion } from '../lib/platform';

interface SettingsPanelProps {
  open: boolean;
  settings: EditorSettings;
  onUpdate: (patch: Partial<EditorSettings>) => void;
  onExportBackup: () => void;
  onRestoreBackup: () => void;
  onOpenLink: (url: string) => void | Promise<void>;
  onClose: () => void;
}

export function SettingsPanel({
  open,
  settings,
  onUpdate,
  onExportBackup,
  onRestoreBackup,
  onOpenLink,
  onClose,
}: SettingsPanelProps) {
  const [version, setVersion] = useState('0.1.0');

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
              label="Show preview"
              checked={settings.showPreview}
              onChange={(showPreview) => onUpdate({ showPreview })}
            />
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
              <button type="button" onClick={onExportBackup}>Export workspace backup</button>
              <button type="button" onClick={onRestoreBackup}>Restore backup</button>
            </div>
            <p className="settings-note">
              Recovery snapshots are kept in the app's local webview storage. Document content is never intentionally logged.
            </p>
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
