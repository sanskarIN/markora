import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { en, type TranslationKey } from './en';
import { hi } from './hi';

export type Locale = 'en' | 'hi';
export type TranslationValues = Record<string, string | number>;

const LOCALE_STORAGE_KEY = 'markora.locale.v1';

const catalogs: Record<Locale, Record<TranslationKey, string>> = {
  en,
  hi,
};

export const SUPPORTED_LOCALES: readonly Locale[] = ['en', 'hi'];

export function normalizeLocale(value: unknown): Locale {
  return value === 'hi' ? 'hi' : 'en';
}

function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'en';

  const persisted = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  if (persisted === 'en' || persisted === 'hi') return persisted;

  return window.navigator.language.toLowerCase().startsWith('hi') ? 'hi' : 'en';
}

export function translate(
  locale: Locale,
  key: TranslationKey,
  values: TranslationValues = {},
): string {
  const template = catalogs[locale][key] ?? en[key];
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, token: string) => {
    const value = values[token];
    return value === undefined ? match : String(value);
  });
}

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, values?: TranslationValues) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = 'ltr';
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  }, [locale]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale: setLocaleState,
      t: (key, values) => translate(locale, key, values),
    }),
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used inside I18nProvider.');
  return value;
}
