import { useI18n, type Locale } from '../i18n';

export function LanguageSettings() {
  const { locale, setLocale, t } = useI18n();

  return (
    <label className="setting-row">
      <span>{t('language')}</span>
      <select value={locale} onChange={(event) => setLocale(event.target.value as Locale)}>
        <option value="en">{t('english')}</option>
        <option value="hi">{t('hindi')}</option>
      </select>
    </label>
  );
}
