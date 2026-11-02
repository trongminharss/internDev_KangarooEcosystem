import React, {useEffect, useMemo, useRef} from 'react';
import {Animated, StyleSheet, View} from 'react-native';
import {ColorsProps, useTheme} from '@/core/theme';
import {FIcon} from '@/shared/components';
import {FOutlined, tokens} from '@/shared/styles';

/** Illustration of a device whose status light blinks fast (pairing mode). */
export const BlinkingDevice: React.FC = () => {
  const {theme} = useTheme();
  const {colors} = theme;
  const styles = useMemo(() => createStyles(colors), [colors]);
  const blink = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(blink, {
          toValue: 0.15,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(blink, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [blink]);

  return (
    <View style={styles.stage}>
      <View style={styles.halo}>
        <View style={styles.device}>
          <Animated.View style={[styles.led, {opacity: blink}]} />
          <FIcon
            icon={FOutlined.button_power}
            size={22}
            iconColor={colors.border2}
          />
        </View>
      </View>
    </View>
  );
};

export default BlinkingDevice;

const createStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    stage: {
      height: 200,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.grey1,
      borderRadius: tokens.borderRadius.medium,
    },
    halo: {
      width: 156,
      height: 156,
      borderRadius: 78, // circle: half of 156
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    device: {
      width: 104,
      height: 84,
      borderRadius: tokens.borderRadius.medium,
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.border1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: tokens.spacing.s,
    },
    led: {
      width: 10,
      height: 10,
      borderRadius: 5, // circle: half of 10
      backgroundColor: colors.warning,
    },
  });
