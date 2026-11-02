/**
 * KGR Color System
 * Primitive and semantic color tokens mapped 1:1 from the Figma style guide.
 */
export const colors = {
  background: {
    dark: {
      over: '#121F37',
      base: '#000C21',
      under: '#000000',
    },
    light: {
      over: '#FFFFFF',
      base: '#FAFBFC',
      under: '#F4F4F4',
    },
  },

  content: {
    onDark: {
      primary: 'rgba(255, 255, 255, 1)',
      secondary: 'rgba(255, 255, 255, 0.7)',
      tertiary: 'rgba(255, 255, 255, 0.5)',
      disabled: 'rgba(255, 255, 255, 0.3)',
      stroke: 'rgba(255, 255, 255, 0.15)',
    },
    onLight: {
      primary: 'rgba(31, 36, 47, 1)',
      secondary: 'rgba(31, 36, 47, 0.7)',
      tertiary: 'rgba(31, 36, 47, 0.5)',
      disabled: 'rgba(31, 36, 47, 0.3)',
      stroke: 'rgba(31, 36, 47, 0.15)',
    },
  },

  functional: {
    success: {
      dim: '#ECF8ED',
      dimHover: '#C5EAC6',
      dimPress: '#A9DFAA',
      strong: '#44BA46',
      strongHover: '#3EA940',
      strongPress: '#3EA940',
    },
    warning: {
      dim: '#FFF5E6',
      dimHover: '#FEF0D9',
      dimPress: '#FDE1B0',
      normal: '#FA9E00',
      normalHover: '#E18E00',
      normalPress: '#C87E00',
    },
    danger: {
      light: '#FDE8E9',
      lightHover: '#FCDDDE',
      lightActive: '#F9B9BB',
      normal: '#ED1C24',
      normalHover: '#D51920',
      normalActive: '#BE161D',
    },
    info: {
      dim: '#EDF4FE',
      dimHover: '#E4EEFE',
      dimActive: '#C8DCFD',
      normal: '#4D8FF9',
      normalHover: '#4581E0',
      normalPress: '#3E72C7',
    },
  },

  green: {
    50: '#ECF8ED',
    100: '#C5EAC6',
    200: '#A9DFAA',
    300: '#82D183',
    400: '#69C86B',
    500: '#44BA46',
    600: '#3EA940',
    700: '#008242',
    800: '#005C2F',
    900: '#00371C',
  },

  orange: {
    50: '#FEF0E9',
    100: '#FBD0BB',
    200: '#F9B99A',
    300: '#F6986C',
    400: '#F4854F',
    500: '#F16623',
    600: '#DB5D20',
    700: '#AB4819',
    800: '#853813',
    900: '#652B0F',
  },

  grey: {
    50: '#F9FAFB', 
    100: '#F2F4F7',
    200: '#E7ECF4',
    300: '#D8DEE8',
    400: '#B9C3D5',
    500: '#A2ADC4',
    600: '#8394AD',
    700: '#566580',
    800: '#3E485C',
    900: '#1F242F',
  },

  blue: {
    50: '#EBF9FF',
    100: '#C1EDFF',
    200: '#A3E4FF',
    300: '#7AD7FF',
    400: '#60D0FF',
    500: '#38C4FF',
    600: '#33B2E8',
    700: '#288BB5',
    800: '#1F6C8C',
    900: '#18526B',
  },
} as const;

export type AppColors = typeof colors;

export const kgrTokens = {
  // 1. Background
  bgDarkOver: colors.background.dark.over,
  bgDarkBase: colors.background.dark.base,
  bgDarkUnder: colors.background.dark.under,
  bgLightOver: colors.background.light.over,
  bgLightBase: colors.background.light.base,
  bgLightUnder: colors.background.light.under,

  // 2. Content on Dark
  onDarkPrimary: colors.content.onDark.primary,
  onDarkSecondary: colors.content.onDark.secondary,
  onDarkTertiary: colors.content.onDark.tertiary,
  onDarkDisabled: colors.content.onDark.disabled,
  onDarkStroke: colors.content.onDark.stroke,

  // 3. Content on Light
  onLightPrimary: colors.content.onLight.primary,
  onLightSecondary: colors.content.onLight.secondary,
  onLightTertiary: colors.content.onLight.tertiary,
  onLightDisabled: colors.content.onLight.disabled,
  onLightStroke: colors.content.onLight.stroke,

  // 4. Functional - Success
  successDim: colors.functional.success.dim,
  successDimHover: colors.functional.success.dimHover,
  successDimPress: colors.functional.success.dimPress,
  successStrong: colors.functional.success.strong,
  successStrongHover: colors.functional.success.strongHover,
  successStrongPress: colors.functional.success.strongPress,

  // 4. Functional - Warning
  warningDim: colors.functional.warning.dim,
  warningDimHover: colors.functional.warning.dimHover,
  warningDimPress: colors.functional.warning.dimPress,
  warningNormal: colors.functional.warning.normal,
  warningNormalHover: colors.functional.warning.normalHover,
  warningNormalPress: colors.functional.warning.normalPress,

  // 4. Functional - Danger
  dangerLight: colors.functional.danger.light,
  dangerLightHover: colors.functional.danger.lightHover,
  dangerLightActive: colors.functional.danger.lightActive,
  dangerNormal: colors.functional.danger.normal,
  dangerNormalHover: colors.functional.danger.normalHover,
  dangerNormalActive: colors.functional.danger.normalActive,

  // 4. Functional - Info
  infoDim: colors.functional.info.dim,
  infoDimHover: colors.functional.info.dimHover,
  infoDimActive: colors.functional.info.dimActive,
  infoNormal: colors.functional.info.normal,
  infoNormalHover: colors.functional.info.normalHover,
  infoNormalPress: colors.functional.info.normalPress,

  // 5. Green
  green50: colors.green[50],
  green100: colors.green[100],
  green200: colors.green[200],
  green300: colors.green[300],
  green400: colors.green[400],
  green500: colors.green[500],
  green600: colors.green[600],
  green700: colors.green[700],
  green800: colors.green[800],
  green900: colors.green[900],

  // 6. Orange
  orange50: colors.orange[50],
  orange100: colors.orange[100],
  orange200: colors.orange[200],
  orange300: colors.orange[300],
  orange400: colors.orange[400],
  orange500: colors.orange[500],
  orange600: colors.orange[600],
  orange700: colors.orange[700],
  orange800: colors.orange[800],
  orange900: colors.orange[900],

  // 7. Grey
  grey50: colors.grey[50],
  grey100: colors.grey[100],
  grey200: colors.grey[200],
  grey300: colors.grey[300],
  grey400: colors.grey[400],
  grey500: colors.grey[500],
  grey600: colors.grey[600],
  grey700: colors.grey[700],
  grey800: colors.grey[800],
  grey900: colors.grey[900],

  // 8. Blue
  blue50: colors.blue[50],
  blue100: colors.blue[100],
  blue200: colors.blue[200],
  blue300: colors.blue[300],
  blue400: colors.blue[400],
  blue500: colors.blue[500],
  blue600: colors.blue[600],
  blue700: colors.blue[700],
  blue800: colors.blue[800],
  blue900: colors.blue[900],
} as const;

export type KgrTokens = typeof kgrTokens;

export default colors;
