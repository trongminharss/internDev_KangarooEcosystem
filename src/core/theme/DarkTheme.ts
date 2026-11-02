import {DefaultTheme} from '@react-navigation/native';
import FTheme from './FTheme';
import {colors, kgrTokens} from './colors';

const darkFonts: DefaultTheme['fonts'] = Object.fromEntries(
  Object.entries(FTheme.fonts).map(([key, style]) => [
    key,
    {...style, color: colors.content.onDark.primary},
  ]),
) as DefaultTheme['fonts'];

export const DarkTheme: DefaultTheme = {
  ...DefaultTheme,
  dark: true,
  fonts: darkFonts,
  colors: {
    ...kgrTokens,
    raw: colors,

    primary: colors.green[500],
    primarySub: colors.green[400],
    primaryBackground: 'rgba(68, 186, 70, 0.16)',
    primaryBorder: 'rgba(68, 186, 70, 0.45)',

    secondary1: colors.orange[500],
    secondarySub1: colors.orange[300],
    secondaryBackground1: 'rgba(241, 102, 35, 0.16)',
    secondaryBorder1: 'rgba(241, 102, 35, 0.45)',

    secondary2: colors.blue[500],
    secondarySub2: colors.blue[300],
    secondaryBackground2: 'rgba(56, 196, 255, 0.16)',
    secondaryBorder2: 'rgba(56, 196, 255, 0.45)',

    secondary3: colors.functional.warning.normal,
    secondarySub3: colors.functional.warning.dimPress,
    secondaryBackground3: 'rgba(250, 158, 0, 0.16)',
    secondaryBorder3: 'rgba(250, 158, 0, 0.45)',

    secondary4: colors.functional.info.normal,
    secondarySub4: colors.functional.info.dimActive,
    secondaryBackground4: 'rgba(77, 143, 249, 0.16)',
    secondaryBorder4: 'rgba(77, 143, 249, 0.45)',

    border1: 'rgba(255, 255, 255, 0.08)',
    border2: colors.content.onDark.stroke,

    info: colors.functional.info.normal,
    infoSub: colors.functional.info.dimActive,
    infoBackground: 'rgba(77, 143, 249, 0.16)',
    infoBorder: 'rgba(77, 143, 249, 0.45)',

    success: colors.green[500],
    successSub: colors.green[400],
    successBackground: 'rgba(68, 186, 70, 0.16)',
    successBorder: 'rgba(68, 186, 70, 0.45)',

    warning: colors.functional.warning.normal,
    warningSub: colors.functional.warning.dimPress,
    warningBackground: 'rgba(250, 158, 0, 0.16)',
    warningBorder: 'rgba(250, 158, 0, 0.45)',

    error: colors.functional.danger.normal,
    errorSub: colors.functional.danger.lightActive,
    errorBackground: 'rgba(237, 28, 36, 0.16)',
    errorBorder: 'rgba(237, 28, 36, 0.45)',

    white: colors.background.dark.base,
    grey1: colors.background.dark.over,
    grey2: 'rgba(255, 255, 255, 0.15)',
    disable: colors.content.onDark.disabled,
    black: '#FFFFFF',

    placeHolder: colors.content.onDark.disabled,
    subtitle: colors.content.onDark.tertiary,
    body: colors.content.onDark.secondary,
    label: 'rgba(255, 255, 255, 0.9)',
    title: colors.content.onDark.primary,

    background: colors.background.dark.base,
    card: colors.background.dark.over,
    text: colors.content.onDark.primary,
    border: colors.content.onDark.stroke,
    notification: colors.functional.danger.normal,

    tabBar: {
      background: colors.background.dark.over,
      indicator: 'rgba(68, 186, 70, 0.22)',
      iconActive: colors.green[400],
      iconInactive: colors.content.onDark.secondary,
      border: colors.content.onDark.stroke,
    },
  },
};

export default DarkTheme;
