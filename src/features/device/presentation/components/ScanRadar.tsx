import React, {useEffect, useMemo, useRef} from 'react';
import {Animated, Easing, StyleSheet, View} from 'react-native';
import {ColorsProps, useTheme} from '@/core/theme';
import {FIcon} from '@/shared/components';
import {FOutlined} from '@/shared/styles';

const SIZE = 168;

/** Pulsing ripple over static rings; freezes when `active` is false. */
export const ScanRadar: React.FC<{active: boolean}> = ({active}) => {
  const {theme} = useTheme();
  const {colors} = theme;
  const styles = useMemo(() => createStyles(colors), [colors]);
  const ripple = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      return;
    }
    const loop = Animated.loop(
      Animated.timing(ripple, {
        toValue: 1,
        duration: 2400,
        easing: Easing.bezier(0.32, 0.72, 0, 1),
        useNativeDriver: true,
      }),
    );
    ripple.setValue(0);
    loop.start();
    return () => loop.stop();
  }, [active, ripple]);

  const rippleScale = ripple.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 1],
  });
  const rippleOpacity = ripple.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 0],
  });

  return (
    <View style={styles.radar} accessibilityRole="progressbar">
      <View style={[styles.ring, styles.ringMid]} />
      <View style={[styles.ring, styles.ringInner]} />
      {active && (
        <Animated.View
          style={[
            styles.ripple,
            {opacity: rippleOpacity, transform: [{scale: rippleScale}]},
          ]}
        />
      )}
      <View style={styles.core}>
        <FIcon
          icon={FOutlined.bluetooth}
          size={24}
          iconColor={active ? colors.primary : colors.body}
        />
      </View>
    </View>
  );
};

export default ScanRadar;

const createStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    radar: {
      width: SIZE,
      height: SIZE,
      borderRadius: SIZE / 2, // circle
      backgroundColor: colors.primaryBackground,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      overflow: 'hidden',
    },
    ring: {
      position: 'absolute',
      borderWidth: 1,
      borderColor: colors.primaryBorder,
    },
    ringMid: {
      width: SIZE * 0.72,
      height: SIZE * 0.72,
      borderRadius: SIZE * 0.36,
    },
    ringInner: {
      width: SIZE * 0.44,
      height: SIZE * 0.44,
      borderRadius: SIZE * 0.22,
    },
    ripple: {
      position: 'absolute',
      width: SIZE,
      height: SIZE,
      borderRadius: SIZE / 2,
      borderWidth: 2,
      borderColor: colors.primary,
    },
    core: {
      width: 48,
      height: 48,
      borderRadius: 24, // circle: half of 48
      backgroundColor: colors.white,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
