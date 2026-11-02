import React, {useEffect, useMemo, useRef} from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import {ColorsProps, useTheme} from '@/core/theme';
import {FIcon, FText} from '@/shared/components';
import {tokens} from '@/shared/styles';

/** Heavy ease-out shared by every simple-add transition. */
export const EASE = Easing.bezier(0.32, 0.72, 0, 1);

/** Fade + short rise on mount; `delay` staggers siblings. */
export const FadeIn: React.FC<{
  delay?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}> = ({delay = 0, style, children}) => {
  const v = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.timing(v, {
      toValue: 1,
      duration: 600,
      delay,
      easing: EASE,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [v, delay]);

  const translateY = v.interpolate({inputRange: [0, 1], outputRange: [16, 0]});
  return (
    <Animated.View style={[style, {opacity: v, transform: [{translateY}]}]}>
      {children}
    </Animated.View>
  );
};

/** 48px round icon button (back, home, refresh…). */
export const CircleButton: React.FC<{
  icon: string;
  onPress: () => void;
  accessibilityLabel?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}> = ({icon, onPress, accessibilityLabel, disabled, style}) => {
  const {theme} = useTheme();
  const {colors} = theme;
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={onPress}
      style={({pressed}) => [
        styles.circle,
        pressed && styles.pressed,
        disabled && styles.dim,
        style,
      ]}>
      <FIcon icon={icon} size={20} iconColor={colors.title} />
    </Pressable>
  );
};

/** Full-width high-contrast pill — the one primary action per stage. */
export const SolidPill: React.FC<{
  label: string;
  onPress: () => void;
  disabled?: boolean;
}> = ({label, onPress, disabled}) => {
  const {theme} = useTheme();
  const {colors} = theme;
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{disabled}}
      disabled={disabled}
      onPress={onPress}
      style={({pressed}) => [
        styles.pill,
        disabled && styles.pillDisabled,
        pressed && styles.pressed,
      ]}>
      <FText
        typo="bodyLabel02"
        color={disabled ? colors.placeHolder : colors.background}>
        {label}
      </FText>
    </Pressable>
  );
};

/** Concentric soft rings behind a centerpiece; they breathe while `active`. */
export const Halo: React.FC<{
  size: number;
  active?: boolean;
  children: React.ReactNode;
}> = ({size, active = false, children}) => {
  const {theme} = useTheme();
  const {colors} = theme;
  const styles = useMemo(() => createStyles(colors), [colors]);
  const breath = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      breath.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {
          toValue: 1,
          duration: 1400,
          easing: EASE,
          useNativeDriver: true,
        }),
        Animated.timing(breath, {
          toValue: 0,
          duration: 1400,
          easing: EASE,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, breath]);

  const ring = (ratio: number, amp: number) => ({
    width: size * ratio,
    height: size * ratio,
    transform: [
      {scale: breath.interpolate({inputRange: [0, 1], outputRange: [1, amp]})},
    ],
  });

  return (
    <View style={[styles.halo, {width: size, height: size}]}>
      <Animated.View style={[styles.ring, ring(1, 1.06)]} />
      <Animated.View style={[styles.ring, ring(0.72, 1.1)]} />
      {children}
    </View>
  );
};

export const createStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    circle: {
      width: 48,
      height: 48,
      borderRadius: tokens.borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.white,
    },
    pill: {
      height: 56,
      borderRadius: tokens.borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.title,
    },
    pillDisabled: {
      backgroundColor: colors.disable,
    },
    pressed: {
      transform: [{scale: 0.97}],
    },
    dim: {
      opacity: 0.4,
    },
    halo: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    ring: {
      position: 'absolute',
      borderRadius: tokens.borderRadius.full,
      borderWidth: 1,
      borderColor: colors.border1,
      backgroundColor: colors.grey1,
      opacity: 0.6,
    },
  });
