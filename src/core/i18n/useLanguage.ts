import {useCallback} from 'react';
import {useTranslation} from 'react-i18next';
import {Storage} from '@/core/utils/storage';
import {LanguageCode} from './i18n';

export const LANGUAGES: readonly {code: LanguageCode; label: string}[] = [
  {code: 'vi', label: 'Tiếng Việt'},
  {code: 'en', label: 'English'},
];

export const useLanguage = () => {
  const {i18n} = useTranslation();
  const language = i18n.language as LanguageCode;
  const setLanguage = useCallback(
    (lng: LanguageCode) => {
      i18n.changeLanguage(lng);
      Storage.setItem(Storage.KEY_LANGUAGE, lng).catch(e =>
        console.error('[i18n] Failed to persist language:', e),
      );
    },
    [i18n],
  );
  return {language, setLanguage};
};
