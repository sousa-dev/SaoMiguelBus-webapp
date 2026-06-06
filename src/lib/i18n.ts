import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import { staticIslandConfig } from '@/config/island';

import de from '@/locales/de.json';
import en from '@/locales/en.json';
import es from '@/locales/es.json';
import fr from '@/locales/fr.json';
import it from '@/locales/it.json';
import pt from '@/locales/pt.json';
import uk from '@/locales/uk.json';
import zh from '@/locales/zh.json';

export const FALLBACK_LOCALE = 'pt';

export const SUPPORTED_LOCALES = ['pt', 'en', 'de', 'es', 'fr', 'it', 'uk', 'zh'] as const;

export const LANGUAGE_NAMES: Record<string, string> = {
  pt: 'Português',
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
  fr: 'Français',
  it: 'Italiano',
  uk: 'Українська',
  zh: '中文',
};

const resources = {
  pt: { translation: pt },
  en: { translation: en },
  de: { translation: de },
  es: { translation: es },
  fr: { translation: fr },
  it: { translation: it },
  uk: { translation: uk },
  zh: { translation: zh },
};

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: FALLBACK_LOCALE,
    supportedLngs: SUPPORTED_LOCALES as unknown as string[],
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'smb_locale',
      caches: ['localStorage'],
    },
  });

if (!i18n.language || !SUPPORTED_LOCALES.includes(i18n.language as never)) {
  void i18n.changeLanguage(staticIslandConfig.defaultLocale);
}

export default i18n;
