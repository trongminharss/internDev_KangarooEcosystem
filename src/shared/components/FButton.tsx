import React, {createContext, useContext} from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleProp,
  TextStyle,
  ViewStyle,
} from 'react-native';
import {ColorsProps, useTheme} from '@/core/theme';
import {tokens} from '@/shared/styles';
import FIcon from './FIcon';
import FText from './FText';

// ============================================================================
// FButton — Figma properties: Kind × Color × Size × State
// ============================================================================
// Kind  : primary (solid) | secondary (tinted/dim) | tertiary (outline) | ghost (text)
// Color : action | success | error | warning | invert | black
// Size  : l (48) | m (40) — the sanctioned control heights (DESIGN.md §5)
// State : default | pressed | disabled   (no hover — React Native has no cursor)
// ============================================================================

type ButtonKind = 'primary' | 'secondary' | 'tertiary' | 'ghost';
type ButtonColor = 'action' | 'success' | 'error' | 'warning' | 'invert' | 'black';
type ButtonSize = 'l' | 'm';
// 'auto' = hug content · 'block' = full width · number = minimum width (px)
type ButtonWidth = 'auto' | 'block' | number;

// --- Color → token set (base / pressed / dim … per Color) ---------------------
type ColorTokens = {
  base: string; // solid background (default)
  press: string; // solid background (pressed)
  dim: string; // tinted background (default)
  dimPress: string; // tinted background (pressed)
  onSolid: string; // text/icon color on the solid background
};

const getColorTokens = (c: ColorsProps, color: ButtonColor): ColorTokens => {
  switch (color) {
    case 'action':
      return {
        base: c.blue500, // Accent 2 / Blue / 500 #38C4FF
        press: c.blue700, // Accent 2 / Blue / 700 #288BB5
        dim: c.blue50, // Accent 2 / Blue / 50 #EBF9FF
        dimPress: c.blue200, // Accent 2 / Blue / 200 #A3E4FF
        onSolid: c.onDarkPrimary, // constant white
      };
    case 'success':
      return {
        base: c.green500, // Brand / Green / 500 #44BA46
        press: c.green700, // Brand / Green / 700 #008242
        dim: c.green50, // Brand / Green / 50 #ECF8ED
        dimPress: c.green200, // Brand / Green / 200 #A9DFAA
        onSolid: c.onDarkPrimary,
      };
    case 'error':
      return {
        base: c.error, // Danger / Normal #ED1C24
        press: c.raw.functional.danger.normalActive, // Danger / Active #BE161D
        dim: c.white, // semantic surface (inverts in dark)
        dimPress: c.raw.functional.danger.lightActive, // Danger / Light Active #F9B9BB
        onSolid: c.onDarkPrimary,
      };
    case 'warning':
      return {
        base: c.warning, // Warning / Normal #FA9E00
        press: c.raw.functional.warning.normalPress, // Warning / Press #C87E00
        dim: c.orange50, // Accent 1 / Orange / 50 #FEF0E9
        dimPress: c.orange200, // Accent 1 / Orange / 200 #F9B99A
        onSolid: c.onDarkPrimary,
      };
    // "Invert" — semantic surface fill, contrasting text (follows the theme).
    case 'invert':
      return {
        base: c.white, // On BG (inverts in dark mode)
        press: c.onDarkSecondary, // On Dark / 70
        dim: c.onDarkTertiary, // On Dark / 50
        dimPress: c.onDarkStroke, // On Dark / 15
        onSolid: c.title, // contrasting text
      };
    // "Black" — ink fill, contrasting text.
    case 'black':
      return {
        base: c.black, // ink (inverts in dark mode)
        press: c.subtitle, // text ramp 50
        dim: c.body, // text ramp 70
        dimPress: c.border1, // stroke 15
        onSolid: c.white, // semantic surface text
      };
  }
};

// --- Kind × state → resolved bg / border / text -------------------------------
type ResolvedColors = {
  bg: string;
  bgPress: string;
  borderColor: string;
  borderWidth: number;
  text: string;
};

// Text color never changes on press (only backgrounds do), so this is
// disabled-aware only — safe to resolve once outside the press callback.
const resolveColors = (
  c: ColorsProps,
  kind: ButtonKind,
  color: ButtonColor,
  disabled: boolean,
): ResolvedColors => {
  const t = getColorTokens(c, color);

  switch (kind) {
    case 'primary': // solid fill
      return {
        bg: disabled ? c.disable : t.base,
        bgPress: t.press,
        borderColor: 'transparent',
        borderWidth: 0,
        text: disabled ? c.body : t.onSolid,
      };
    case 'secondary': // tinted / dim fill
      return {
        bg: disabled ? c.disable : t.dim,
        bgPress: t.dimPress,
        borderColor: 'transparent',
        borderWidth: 0,
        text: disabled ? c.body : t.base,
      };
    case 'tertiary': // outline
      return {
        bg: 'transparent',
        bgPress: t.dim,
        borderColor: disabled ? c.grey2 : t.base,
        borderWidth: 1,
        text: disabled ? c.body : t.base,
      };
    case 'ghost': // text only
      return {
        bg: 'transparent',
        bgPress: t.dim,
        borderColor: 'transparent',
        borderWidth: 0,
        text: disabled ? c.body : t.base,
      };
  }
};

// --- Size → height / padding / gap / text style / icon size -------------------
// Sanctioned control heights (DESIGN.md §5): l = 48 (padding 12), m = 40 (padding 8).
const SIZE = {
  l: {
    height: 48,
    paddingHorizontal: tokens.spacing.xs, // 12
    gap: tokens.spacing._3xs, // 4
    typo: 'bodyLabel03', // 14/20 Medium (DESIGN.md §5)
    icon: 24,
  },
  m: {
    height: 40,
    paddingHorizontal: tokens.spacing._2xs, // 8
    gap: tokens.spacing._3xs, // 4
    typo: 'bodyLabel03', // 14/20 Medium (DESIGN.md §5)
    icon: 20,
  },
} as const;

// Inner shadow : X0 · Y1 · Blur 26.5 · Spread 0 · #FFFFFF @ 50%
const INNER_SHADOW = 'inset 0px 1px 26.5px 0px rgba(255, 255, 255, 0.5)';

// --- Context ------------------------------------------------------------------
type ButtonContextValue = {
  size: ButtonSize;
  textColor: string;
  disabled: boolean;
};

const ButtonContext = createContext<ButtonContextValue>({
  size: 'l',
  textColor: '',
  disabled: false,
});

type ButtonProps = PressableProps & {
  style?: StyleProp<ViewStyle>;
  kind?: ButtonKind;
  color?: ButtonColor;
  size?: ButtonSize;
  /** 'auto' (hug) · 'block' (full width) · number (min width in px). Default 'auto'. */
  width?: ButtonWidth;
  /** Icon-only (square) button — transparent, press feedback only. */
  iconOnly?: boolean;
  /** Text sugar — renders a `FButton.Label`. Ignored when children are given. */
  title?: string;
};

const FButton = ({
  kind = 'primary',
  color = 'success',
  size = 'l',
  width = 'auto',
  iconOnly = false,
  style,
  disabled = false,
  title,
  children,
  ...props
}: ButtonProps) => {
  const {theme} = useTheme();
  const {colors} = theme;
  const isDisabled = disabled === true;

  const {text} = resolveColors(colors, kind, color, isDisabled);
  const value = {size, textColor: text, disabled: isDisabled};

  return (
    <ButtonContext.Provider value={value}>
      <Pressable
        disabled={isDisabled}
        style={state => [
          containerStyle(colors, {
            kind,
            color,
            size,
            pressed: state.pressed,
            disabled: isDisabled,
            iconOnly,
            width,
          }),
          style,
        ]}
        {...props}>
        {title ? <ButtonLabel>{title}</ButtonLabel> : children}
      </Pressable>
    </ButtonContext.Provider>
  );
};

const ButtonLabel = ({
  style,
  numberOfLines,
  children,
}: {
  style?: TextStyle;
  numberOfLines?: number;
  children: React.ReactNode;
}) => {
  const {textColor, size} = useContext(ButtonContext);
  return (
    <FText
      typo={SIZE[size].typo}
      color={textColor}
      style={style}
      numberOfLines={numberOfLines}>
      {children}
    </FText>
  );
};

FButton.Label = ButtonLabel;

const ButtonIcon = ({icon, size}: {icon: string; size?: number}) => {
  const {textColor, size: btnSize} = useContext(ButtonContext);
  return <FIcon icon={icon} size={size ?? SIZE[btnSize].icon} iconColor={textColor} />;
};

FButton.Icon = ButtonIcon;

// Loading indicator — tinted to the current label color.
const ButtonCircular = () => {
  const {textColor} = useContext(ButtonContext);
  return <ActivityIndicator color={textColor} />;
};

FButton.Circular = ButtonCircular;

// --- Container style factory (memoizable on colors + options) -----------------
type ContainerOpts = {
  kind: ButtonKind;
  color: ButtonColor;
  size: ButtonSize;
  pressed: boolean;
  disabled: boolean;
  iconOnly: boolean;
  width: ButtonWidth;
};

const containerStyle = (c: ColorsProps, o: ContainerOpts): ViewStyle => {
  const sz = SIZE[o.size];

  if (o.iconOnly) {
    return {
      width: sz.height,
      height: sz.height,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: tokens.borderRadius.full, // circle
      backgroundColor: o.pressed && !o.disabled ? c.grey1 : 'transparent',
    };
  }

  const r = resolveColors(c, o.kind, o.color, o.disabled);
  const filled = o.kind === 'primary' || o.kind === 'secondary';
  return {
    height: sz.height,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: tokens.borderRadius.small, // 8 — button radius (DESIGN.md §5.3)
    paddingHorizontal: sz.paddingHorizontal,
    gap: sz.gap,
    backgroundColor: o.pressed ? r.bgPress : r.bg,
    borderColor: r.borderColor,
    borderWidth: r.borderWidth,
    boxShadow: filled && !o.disabled ? INNER_SHADOW : undefined,
    // width: 'auto' hugs; 'block' fills container; number = min width
    alignSelf: o.width === 'block' ? 'stretch' : undefined,
    minWidth: typeof o.width === 'number' ? o.width : undefined,
  };
};

export type {ButtonKind, ButtonColor, ButtonSize};
export default FButton;
