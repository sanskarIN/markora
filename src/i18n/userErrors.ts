import type { AppTranslationKey, TranslationValues } from './index';

type Translator = (key: AppTranslationKey, values?: TranslationValues) => string;

const SAFE_ERROR_KEYS: Record<string, AppTranslationKey> = {
  'The dropped file exceeds Markora’s 16 MB safety limit.': 'droppedTooLarge',
  'Only Markdown and plain-text files can be dropped into Markora.': 'droppedUnsupported',
  'The dropped file is not valid UTF-8 text.': 'droppedInvalidUtf8',
  'This is not a Markora backup file.': 'invalidBackupFile',
  'Unsupported workspace version.': 'unsupportedWorkspace',
  'Invalid tabs.': 'invalidBackupTabs',
  'Invalid tab count.': 'invalidBackupTabCount',
  'Invalid active tab.': 'invalidBackupActiveTab',
};

export function localizeUserError(error: unknown, t: Translator): string {
  if (error instanceof SyntaxError) return t('invalidBackupFile');

  const raw = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  const key = SAFE_ERROR_KEYS[raw];
  return key ? t(key) : t('unexpectedError');
}
