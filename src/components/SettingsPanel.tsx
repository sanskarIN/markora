import { useEffect, useState } from 'react';

import { useI18n, type AppTranslationKey } from '../i18n';
import { getLocalFontStack, LOCAL_FONT_PRESETS } from '../lib/fonts';
import type { LayoutMode } from '../lib/layout';
import { BUILD_VERSION, getAppVersion } from '../lib/platform';
import { buildPrintStyle } from '../lib/print';
import type { DocumentTab, EditorSettings } from '../types';
import { ExportTemplatePicker } from './ExportTemplatePicker';
import { LanguageSettings } from './LanguageSettings';
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

const FONT_COPY: Record<
  EditorSettings['fontPreset'],
  { label: AppTranslationKey; description: AppTranslationKey }
> = {
  'system-sans': { label: 'systemSans', description: 'systemSansDescription' },
  'system-serif': { label: 'systemSerif', description: 'systemSerifDescription' },
  'system-mono': { label: 'systemMono', description: 'systemMonoDescription' },
  'humanist-sans': { label: 'humanistSans', description: 'humanistSansDescription' },
  'reading-serif': { label: 'readingSerif', description: 'readingSerifDescription' },
};

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
  const { t } = useI18n();
  const [version, setVersion] = useState(BUILD_VERSION);

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
    void getAppVersion().then(setVersion).catch(() => setVersion(BUILD_VERSION));
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
            <span className="pane-kicker">{t('preferences')}</span>
            <h2 id="settings-title">{t('settings')}</h2>
          </div>
          <button className="icon-close" type="button" onClick={onClose} aria-label={t('closeSettings')}>
            ×
          </button>
        </header>

        <div className="settings-scroll">
          <SettingsSection title={t('appearance')} description={t('appearanceDescription')}>
            <SettingRow label={t('colorMode')}>
              <select
                value={settings.themeMode}
                onChange={(event) =>
                  onUpdate({ themeMode: event.target.value as EditorSettings['themeMode'] })
                }
              >
                <option value="system">{t('system')}</option>
                <option value="light">{t('light')}</option>
                <option value="dark">{t('dark')}</option>
              </select>
            </SettingRow>
            <SettingRow label={t('editorTheme')}>
              <select
                value={settings.editorTheme}
                onChange={(event) =>
                  onUpdate({ editorTheme: event.target.value as EditorSettings['editorTheme'] })
                }
              >
                <option value="graphite">{t('graphite')}</option>
                <option value="aurora">{t('aurora')}</option>
                <option value="paper">{t('paper')}</option>
              </select>
            </SettingRow>
            <SettingRow label={t('writingFont')}>
              <select
                value={settings.fontPreset}
                onChange={(event) =>
                  onUpdate({ fontPreset: event.target.value as EditorSettings['fontPreset'] })
                }
              >
                {LOCAL_FONT_PRESETS.map((preset) => {
                  const copy = FONT_COPY[preset.id];
                  return (
                    <option key={preset.id} value={preset.id} title={t(copy.description)}>
                      {t(copy.label)}
                    </option>
                  );
                })}
              </select>
            </SettingRow>
            <p className="settings-note">{t('localFontNote')}</p>
            <SettingRow label={t('workspaceLayout')}>
              <select
                value={layoutMode}
                onChange={(event) => onLayoutModeChange(event.target.value as LayoutMode)}
              >
                <option value="split">{t('splitEditorPreview')}</option>
                <option value="editor">{t('editorOnly')}</option>
                <option value="preview">{t('previewOnly')}</option>
              </select>
            </SettingRow>
            <SettingRow label={t('editorShare', { percent: editorPanePercent })}>
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
            <button type="button" onClick={onResetLayout}>{t('resetLayout')}</button>
            <SettingRow label={t('fontSizeLabel', { size: settings.fontSize })}>
              <input
                type="range"
                min="12"
                max="28"
                step="1"
                value={settings.fontSize}
                onChange={(event) => onUpdate({ fontSize: Number(event.target.value) })}
              />
            </SettingRow>
            <SettingRow label={t('lineHeightLabel', { height: settings.lineHeight.toFixed(2) })}>
              <input
                type="range"
                min="1.2"
                max="2.2"
                step="0.05"
                value={settings.lineHeight}
                onChange={(event) => onUpdate({ lineHeight: Number(event.target.value) })}
              />
            </SettingRow>
            <Toggle label={t('wordWrap')} checked={settings.wordWrap} onChange={(wordWrap) => onUpdate({ wordWrap })} />
            <Toggle
              label={t('showOutline')}
              checked={settings.showOutline}
              onChange={(showOutline) => onUpdate({ showOutline })}
            />
            <Toggle
              label={t('showPreviewSplit')}
              checked={settings.showPreview}
              onChange={(showPreview) => onUpdate({ showPreview })}
            />
          </SettingsSection>

          <SettingsSection title={t('printPdf')} description={t('printPdfDescription')}>
            <SettingRow label={t('pageSize')}>
              <select
                value={settings.printPageSize}
                onChange={(event) =>
                  onUpdate({ printPageSize: event.target.value as EditorSettings['printPageSize'] })
                }
              >
                <option value="auto">{t('printerDefault')}</option>
                <option value="a4">{t('a4')}</option>
                <option value="letter">{t('usLetter')}</option>
              </select>
            </SettingRow>
            <SettingRow label={t('pageMargin', { margin: settings.printMarginMm })}>
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
              label={t('keepHeadings')}
              checked={settings.printKeepHeadings}
              onChange={(printKeepHeadings) => onUpdate({ printKeepHeadings })}
            />
            <Toggle
              label={t('wrapCodeLines')}
              checked={settings.printCodeWrap}
              onChange={(printCodeWrap) => onUpdate({ printCodeWrap })}
            />
            <Toggle
              label={t('includePrintMetadata')}
              checked={settings.printMetadata}
              onChange={(printMetadata) => onUpdate({ printMetadata })}
            />
            <p className="settings-note">{t('printSettingsNote')}</p>
            <ExportTemplatePicker onUpdate={onUpdate} />
          </SettingsSection>

          <SettingsSection title={t('workspacePresets')} description={t('workspacePresetsDescription')}>
            <SessionPresetManager
              settings={settings}
              layoutMode={layoutMode}
              editorPanePercent={editorPanePercent}
              onUpdateSettings={onUpdate}
              onLayoutModeChange={onLayoutModeChange}
              onEditorPanePercentChange={onEditorPanePercentChange}
            />
          </SettingsSection>

          <SettingsSection title={t('keyboardShortcuts')} description={t('keyboardShortcutsDescription')}>
            <ShortcutSettings />
          </SettingsSection>

          <SettingsSection title={t('privacy')} description={t('privacyDescription')}>
            <Toggle label={t('autosaveFiles')} checked={settings.autosave} onChange={(autosave) => onUpdate({ autosave })} />
            <SettingRow label={t('autosaveDelay', { seconds: (settings.autosaveDelayMs / 1000).toFixed(1) })}>
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
              <button type="button" onClick={onReloadActiveFromDisk}>{t('reloadDisk')}</button>
              <button type="button" onClick={onExportBackup}>{t('exportWorkspaceBackup')}</button>
              <button type="button" onClick={onRestoreBackup}>{t('restoreBackup')}</button>
            </div>
            <p className="settings-note">{t('autosaveConflictNote')}</p>
          </SettingsSection>

          <SettingsSection title={t('recovery')} description={t('recoveryDescription')}>
            <RecoveryInspector
              tabs={tabs}
              activeId={activeId}
              onActivate={onActivateTab}
              onCloseTab={onCloseTab}
              onResetWorkspace={onResetWorkspace}
            />
          </SettingsSection>

          <SettingsSection title={t('accessibility')} description={t('accessibilityDescription')}>
            <Toggle
              label={t('reducedMotion')}
              checked={settings.reducedMotion}
              onChange={(reducedMotion) => onUpdate({ reducedMotion })}
            />
            <p className="settings-note">{t('accessibilityNote')}</p>
            <LanguageSettings />
          </SettingsSection>

          <SettingsSection title={t('updates')} description={t('updatesDescription')}>
            <p className="settings-note">{t('updatesNote')}</p>
            <button type="button" onClick={() => void onOpenLink('https://github.com/sanskarIN/markora/releases')}>
              {t('openReleases')}
            </button>
          </SettingsSection>

          <SettingsSection title={t('about')} description={`Markora ${version} · MIT License`}>
            <div className="about-card">
              <img src="/markora-logo.svg" alt={t('markoraLogo')} width="56" height="56" />
              <div>
                <strong>{t('appName')}</strong>
                <p>{t('aboutDescription')}</p>
                <b>{t('madeBy')}</b>
              </div>
            </div>
            <div className="about-links">
              <button type="button" onClick={() => void onOpenLink('https://github.com/sanskarIN')}>{t('github')}</button>
              <button type="button" onClick={() => void onOpenLink('https://buymeacoffee.com/sanskarIN')}>{t('buyMeCoffee')}</button>
              <button type="button" onClick={() => void onOpenLink('mailto:sanskarin@outlook.in')}>{t('businessEmail')}</button>
              <button type="button" onClick={() => void onOpenLink('mailto:sanskarin.business@gmail.com')}>{t('alternateBusinessEmail')}</button>
              <button type="button" onClick={() => void onOpenLink('mailto:supportramsandesh@gmail.com')}>{t('support')}</button>
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
