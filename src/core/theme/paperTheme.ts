import {MD3DarkTheme, MD3LightTheme, MD3Theme as PaperTheme} from 'react-native-paper';
import {DefaultTheme} from '@react-navigation/native';

export function buildPaperTheme(theme: DefaultTheme): PaperTheme {
  const base = theme.dark ? MD3DarkTheme : MD3LightTheme;
  const fonts = Object.fromEntries(
    Object.entries(base.fonts).map(([key, style]) => [
      key,
      {
        ...style,
        fontFamily: key.startsWith('body')
          ? 'ClanPro-Book'
          : key.startsWith('label')
          ? 'ClanPro-Medium'
          : 'ClanPro-Bold',
        fontWeight: key.startsWith('body')
          ? '400'
          : key.startsWith('label')
          ? '500'
          : '700',
      },
    ]),
  ) as typeof base.fonts;
  return {
    ...base,
    fonts,
    colors: {
      ...base.colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
      surface: theme.colors.card,
      onSurface: theme.colors.label,
      outline: theme.colors.border2,
      onSurfaceVariant: theme.colors.placeHolder,
    },
  };
}

export default buildPaperTheme;