import type { TranslationKey } from './en';
import type { TranslationValues } from './index';

export interface FindErrorTranslation {
  key: TranslationKey;
  values?: TranslationValues;
}

const FIND_ERROR_MAP: Record<string, FindErrorTranslation> = {
  'Regex mode is disabled for documents larger than 2 MB.': { key: 'regexDocumentTooLarge' },
  'Regex backreferences are disabled for predictable search performance.': {
    key: 'regexBackreferencesDisabled',
  },
  'Regex lookaround is disabled for predictable search performance.': {
    key: 'regexLookaroundDisabled',
  },
  'Nested quantified groups are disabled for predictable search performance.': {
    key: 'regexNestedQuantifiersDisabled',
  },
  'Regex patterns that can match empty text are not supported.': {
    key: 'regexEmptyMatchDisabled',
  },
  'Invalid regular expression.': { key: 'invalidRegex' },
};

export function getFindErrorTranslation(error: string | null): FindErrorTranslation | null {
  if (!error) return null;

  const lengthMatch = /^Regex searches are limited to (\d+) characters\.$/.exec(error);
  if (lengthMatch) {
    return {
      key: 'regexTooLong',
      values: { limit: Number(lengthMatch[1]) },
    };
  }

  return FIND_ERROR_MAP[error] ?? { key: 'invalidQuery' };
}
