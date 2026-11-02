import {ColorSchemeName} from 'react-native';
import {DefaultTheme} from '@react-navigation/native';
import FTheme from './FTheme';
import DarkTheme from './DarkTheme';

export type ThemeMode = 'light' | 'dark' | 'system';

export const THEME_MODES: readonly ThemeMode[] = ['light', 'dark', 'system'];

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system';
}

export function resolveTheme(mode: ThemeMode, scheme: ColorSchemeName | null): DefaultTheme {
  if (mode === 'dark') {
    return DarkTheme;
  }
  if (mode === 'light') {
    return FTheme;
  }
  return scheme === 'dark' ? DarkTheme : FTheme;
}

export function resolveIsDark(mode: ThemeMode, scheme: ColorSchemeName | null): boolean {
  if (mode === 'dark') {
    return true;
  }
  if (mode === 'light') {
    return false;
  }
  return scheme === 'dark';
}
