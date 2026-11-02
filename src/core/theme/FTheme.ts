import {DefaultTheme} from '@react-navigation/native';
import {TextStyle} from 'react-native';

import {colors, AppColors, kgrTokens, KgrTokens} from './colors';

export interface FontStylesProps extends TextStyle {
  fontFamily?: string;
  fontSize: number;
  fontWeight?: 'normal' | 'bold' | '400' | '500' | '600' | '700';
  letterSpacing?: number;
  lineHeight?: number;
  color?: string;
}

export interface NavigationFontStyleProps extends FontStylesProps {
  fontFamily: string;
  fontWeight: 'normal' | 'bold' | '400' | '500' | '600' | '700';
}

const TEXT_COLOR = '#1F242F';

export const FontFamily = {
  book: 'ClanPro-Book',
  medium: 'ClanPro-Medium',
  bold: 'ClanPro-Bold',
} as const;

const createFontStyle = (
  fontFamily: (typeof FontFamily)[keyof typeof FontFamily],
  fontSize: number,
  lineHeight: number,
): FontStylesProps => ({
  fontFamily,
  fontSize,
  letterSpacing: 0,
  lineHeight,
  color: TEXT_COLOR,
});

const createNavigationFontStyle = (
  style: FontStylesProps,
  fontWeight: NavigationFontStyleProps['fontWeight'],
): NavigationFontStyleProps => ({
  ...style,
  fontFamily: style.fontFamily!,
  fontWeight,
});

/** Primitive typography tokens mapped 1:1 from the Figma style guide. */
export const TypographyStyles = {
  headline0: createFontStyle(FontFamily.bold, 128, 128),
  headline1: createFontStyle(FontFamily.bold, 96, 96),
  headline2: createFontStyle(FontFamily.bold, 72, 72),
  headline3: createFontStyle(FontFamily.bold, 60, 60),
  headline4: createFontStyle(FontFamily.bold, 48, 60),
  headline5: createFontStyle(FontFamily.bold, 36, 40),
  headline6: createFontStyle(FontFamily.medium, 30, 36),
  headline7: createFontStyle(FontFamily.medium, 26, 32),
  headline8: createFontStyle(FontFamily.medium, 22, 28),

  bodyLabel01: createFontStyle(FontFamily.medium, 18, 28),
  bodyLabel02: createFontStyle(FontFamily.medium, 16, 24),
  bodyLabel03: createFontStyle(FontFamily.medium, 14, 20),
  bodyLabel04: createFontStyle(FontFamily.book, 12, 18),

  body01: createFontStyle(FontFamily.book, 18, 28),
  // The source image shows 16/140px; 16/24px is the normalized mobile token.
  body02: createFontStyle(FontFamily.book, 16, 24),
  body03: createFontStyle(FontFamily.book, 14, 20),
  body04: createFontStyle(FontFamily.book, 12, 18),
  body05: createFontStyle(FontFamily.book, 10, 12),
} as const;

export interface ColorsProps extends KgrTokens {
  primary: string;
  primarySub: string;
  primaryBackground: string;
  primaryBorder: string;

  secondary1: string;
  secondarySub1: string;
  secondaryBackground1: string;
  secondaryBorder1: string;

  secondary2: string;
  secondarySub2: string;
  secondaryBackground2: string;
  secondaryBorder2: string;

  secondary3: string;
  secondarySub3: string;
  secondaryBackground3: string;
  secondaryBorder3: string;

  secondary4: string;
  secondarySub4: string;
  secondaryBackground4: string;
  secondaryBorder4: string;

  border1: string;
  border2: string;

  info: string;
  infoSub: string;
  infoBackground: string;
  infoBorder: string;

  success: string;
  successSub: string;
  successBackground: string;
  successBorder: string;

  warning: string;
  warningSub: string;
  warningBackground: string;
  warningBorder: string;

  error: string;
  errorSub: string;
  errorBackground: string;
  errorBorder: string;

  background: string;
  card: string;
  text: string;
  border: string;
  notification: string;

  white: string;
  grey1: string;
  grey2: string;
  disable: string;
  black: string;

  placeHolder: string;
  subtitle: string;
  body: string;
  label: string;
  title: string;

  tabBar: {
    background: string;
    indicator: string;
    iconActive: string;
    iconInactive: string;
    border: string;
  };

  raw: AppColors;
}

declare module '@react-navigation/native' {
  export interface DefaultTheme {
    dark: boolean;
    fonts: {
      regular: NavigationFontStyleProps;
      medium: NavigationFontStyleProps;
      bold: NavigationFontStyleProps;
      heavy: NavigationFontStyleProps;

      headline0: FontStylesProps;
      headline1: FontStylesProps;
      headline2: FontStylesProps;
      headline3: FontStylesProps;
      headline4: FontStylesProps;
      headline5: FontStylesProps;
      headline6: FontStylesProps;
      headline7: FontStylesProps;
      headline8: FontStylesProps;

      bodyLabel01: FontStylesProps;
      bodyLabel02: FontStylesProps;
      bodyLabel03: FontStylesProps;
      bodyLabel04: FontStylesProps;

      body01: FontStylesProps;
      body02: FontStylesProps;
      body03: FontStylesProps;
      body04: FontStylesProps;
      body05: FontStylesProps;

      // Legacy aliases. Keep them while existing screens migrate to the
      // style-guide token names above.
      largeTitle: FontStylesProps;
      title1: FontStylesProps;
      title2: FontStylesProps;
      title3: FontStylesProps;
      title4: FontStylesProps;
      title5: FontStylesProps;
      title6: FontStylesProps;

      bodyText1: FontStylesProps;
      bodyText2: FontStylesProps;

      buttonText1: FontStylesProps;
      buttonText2: FontStylesProps;
      buttonText3: FontStylesProps;
      buttonText4: FontStylesProps;
      buttonText5: FontStylesProps;

      subtitle1: FontStylesProps;
      subtitle2: FontStylesProps;
      subtitle3: FontStylesProps;
      subtitle4: FontStylesProps;

      label1: FontStylesProps;
      label2: FontStylesProps;
      label3: FontStylesProps;
      label4: FontStylesProps;
      label5: FontStylesProps;

      placeholder1: FontStylesProps;
      placeholder2: FontStylesProps;
    };
    colors: ColorsProps;
  }
}

export const FTheme: DefaultTheme = {
  ...DefaultTheme,
  fonts: {
    // React Navigation-required base font variants.
    regular: createNavigationFontStyle(TypographyStyles.body03, '400'),
    medium: createNavigationFontStyle(TypographyStyles.bodyLabel03, '500'),
    bold: createNavigationFontStyle(
      createFontStyle(FontFamily.bold, 14, 20),
      '700',
    ),
    heavy: createNavigationFontStyle(
      createFontStyle(FontFamily.bold, 16, 24),
      '700',
    ),

    // Canonical style-guide tokens.
    ...TypographyStyles,

    // Backward-compatible semantic aliases for existing screens.
    largeTitle: {...TypographyStyles.headline5},
    title1: {...TypographyStyles.headline7},
    title2: {...TypographyStyles.headline8},
    title3: {...TypographyStyles.bodyLabel01},
    title4: {...TypographyStyles.bodyLabel02},
    title5: {...TypographyStyles.bodyLabel03},
    title6: {...TypographyStyles.bodyLabel04},

    bodyText1: {...TypographyStyles.body01},
    bodyText2: {...TypographyStyles.body02},

    buttonText1: {...TypographyStyles.bodyLabel01},
    buttonText2: {...TypographyStyles.bodyLabel02},
    buttonText3: {...TypographyStyles.bodyLabel03},
    buttonText4: {...TypographyStyles.bodyLabel04},
    buttonText5: {...TypographyStyles.body04},

    subtitle1: {...TypographyStyles.body02},
    subtitle2: {...TypographyStyles.body03},
    subtitle3: {...TypographyStyles.body04},
    subtitle4: {...TypographyStyles.body05},

    label1: {...TypographyStyles.bodyLabel02},
    label2: {...TypographyStyles.body02},
    label3: {...TypographyStyles.bodyLabel03},
    label4: {...TypographyStyles.body03},
    label5: {...TypographyStyles.body04},

    placeholder1: {...TypographyStyles.body02},
    placeholder2: {...TypographyStyles.body03},
  },
  colors: {
    ...kgrTokens,
    raw: colors,

    primary: colors.green[500],
    primarySub: colors.green[600],
    primaryBackground: colors.green[50],
    primaryBorder: colors.green[200],

    secondary1: colors.orange[500],
    secondarySub1: colors.orange[600],
    secondaryBackground1: colors.orange[50],
    secondaryBorder1: colors.orange[200],

    secondary2: colors.blue[500],
    secondarySub2: colors.blue[600],
    secondaryBackground2: colors.blue[50],
    secondaryBorder2: colors.blue[200],

    secondary3: colors.functional.warning.normal,
    secondarySub3: colors.functional.warning.normalHover,
    secondaryBackground3: colors.functional.warning.dim,
    secondaryBorder3: colors.functional.warning.dimPress,

    secondary4: colors.functional.info.normal,
    secondarySub4: colors.functional.info.normalHover,
    secondaryBackground4: colors.functional.info.dim,
    secondaryBorder4: colors.functional.info.dimActive,

    border1: colors.content.onLight.stroke,
    border2: colors.grey[300],

    info: colors.functional.info.normal,
    infoSub: colors.functional.info.normalHover,
    infoBackground: colors.functional.info.dim,
    infoBorder: colors.functional.info.dimHover,

    success: colors.functional.success.strong,
    successSub: colors.functional.success.strongHover,
    successBackground: colors.functional.success.dim,
    successBorder: colors.functional.success.dimHover,

    warning: colors.functional.warning.normal,
    warningSub: colors.functional.warning.normalHover,
    warningBackground: colors.functional.warning.dim,
    warningBorder: colors.functional.warning.dimHover,

    error: colors.functional.danger.normal,
    errorSub: colors.functional.danger.normalHover,
    errorBackground: colors.functional.danger.light,
    errorBorder: colors.functional.danger.lightHover,

    background: colors.background.light.base,
    card: colors.background.light.over,
    text: colors.grey[900],
    border: colors.grey[300],
    notification: colors.functional.danger.normal,

    white: colors.background.light.over,
    grey1: colors.grey[100],
    grey2: colors.grey[200],
    disable: colors.background.light.under,
    black: colors.grey[900],

    placeHolder: colors.content.onLight.disabled,
    subtitle: colors.content.onLight.secondary,
    body: colors.grey[500],
    label: 'rgba(31, 36, 47, 0.9)',
    title: colors.grey[900],

    tabBar: {
      background: colors.background.light.over,
      indicator: 'rgba(68, 186, 70, 0.18)',
      iconActive: colors.green[500],
      iconInactive: colors.grey[500],
      border: colors.grey[200],
    },
  },
};

export default FTheme;
