import React, {useEffect} from 'react';
import {Appearance, Platform, StatusBar} from 'react-native';

import i18next, {isLanguageCode, LanguageCode} from '@/core/i18n';
import {Storage} from '@/core/utils/storage';
import {useTheme} from '@/core/theme';
import {getFcmToken, registerListenerWithFCM} from '@/core/utils/firebase/fcmHelper';
import {AppProviders} from './providers';
import {RootNavigator} from './navigation';

const ThemedApp: React.FC = () => {
  const {isDark, mode, theme} = useTheme();

  useEffect(() => {
    StatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content');
    if (Platform.OS === 'android') {
      (StatusBar as any).setBackgroundColor?.(
        isDark ? theme.colors.background : 'transparent',
      );
      (StatusBar as any).setTranslucent?.(true);
    }
    if (Appearance.setColorScheme) {
      Appearance.setColorScheme(
        mode === 'system' ? 'auto' : isDark ? 'dark' : 'light',
      );
    }
  }, [isDark, mode, theme.colors.background]);

  return <RootNavigator />;
};

export const App: React.FC = () => {
  /** Setup Firebase Cloud Messaging */
  useEffect(() => {
    getFcmToken();
    const unsubscribe = registerListenerWithFCM();
    return unsubscribe;
  }, []);

  /** Hydrate stored language preference */
  useEffect(() => {
    Storage.getItem<LanguageCode>(Storage.KEY_LANGUAGE)
      .then(stored => {
        if (isLanguageCode(stored)) {
          i18next.changeLanguage(stored);
        }
      })
      .catch(e => console.error('[i18n] Failed to load stored language:', e));
  }, []);

  return (
    <AppProviders>
      <ThemedApp />
    </AppProviders>
  );
};

export default App;
