import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import {useColorScheme} from 'react-native';
import {DefaultTheme} from '@react-navigation/native';
import {Storage} from '@/core/utils/storage';
import FTheme from './FTheme';
import {isThemeMode, resolveIsDark, resolveTheme, ThemeMode} from './themeUtils';

export interface ThemeContextValue {
  theme: DefaultTheme;
  isDark: boolean;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: FTheme,
  isDark: false,
  mode: 'system',
  setMode: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export interface ThemeProviderProps {
  children: ReactNode;
  /** Truyền theme tĩnh để fix một màn hình/subtree (mặc định: dynamic theo mode) */
  theme?: DefaultTheme;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  theme: fixedTheme,
}) => {
  const systemScheme = useColorScheme();
  const [modeState, setModeState] = useState<ThemeMode>('system');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const stored = await Storage.getItem<ThemeMode>(Storage.KEY_THEME_MODE);
        if (mounted && isThemeMode(stored)) {
          setModeState(stored);
        }
      } catch (e) {
        console.error('[ThemeProvider] Failed to load theme mode:', e);
      } finally {
        if (mounted) {
          setIsReady(true);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    Storage.setItem(Storage.KEY_THEME_MODE, next).catch(e =>
      console.error('[ThemeProvider] Failed to persist theme mode:', e),
    );
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    if (fixedTheme) {
      return {theme: fixedTheme, isDark: fixedTheme.dark, mode: modeState, setMode};
    }
    return {
      theme: resolveTheme(modeState, systemScheme),
      isDark: resolveIsDark(modeState, systemScheme),
      mode: modeState,
      setMode,
    };
  }, [fixedTheme, modeState, systemScheme, setMode]);

  if (!isReady) {
    return null;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};