import i18next from 'i18next';
import {initReactI18next} from 'react-i18next';
import en from './locales/en.json';
import vi from './locales/vi.json';

export type LanguageCode = 'vi' | 'en';

export function isLanguageCode(value: unknown): value is LanguageCode {
  return value === 'vi' || value === 'en';
}

export const languageResources = {
  en: {translation: en},
  vi: {translation: vi},
};

i18next.use(initReactI18next).init({
  compatibilityJSON: 'v3',
  lng: 'vi',
  fallbackLng: 'en',
  resources: languageResources,
  interpolation: {
    escapeValue: false,
  },
});

export default i18next;
