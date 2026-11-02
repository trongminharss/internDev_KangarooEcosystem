import React, {useEffect, useRef} from 'react';
import {Animated, Easing, Pressable, StyleSheet, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useTheme} from '@/core/theme';
import {FText} from '@/shared/components';
import {tokens} from '@/shared/styles';

interface Props {
  code: string;
  percent: number;
  color: string;
  /** Stagger for the fill-up animation. */
  index: number;
  onPress: () => void;
}

const BODY_H = 112;
const PLEATS = [0.2, 0.32, 0.44, 0.56, 0.68, 0.8];

/** A filter cartridge whose liquid level shows the remaining life. */
export const FilterCartridge: React.FC<Props> = ({
  code,
  percent,
  color,
  index,
  onPress,
}) => {
  const {theme} = useTheme();
  const {colors} = theme;
  const {t} = useTranslation();
  const fill = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fill, {
      toValue: 1,
      duration: 900,
      delay: 120 * index,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [fill, index]);

  const level = (BODY_H * percent) / 100;
  const shine = {backgroundColor: colors.onDarkPrimary};

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('device.filter.a11y', {code, percent})}
      onPress={onPress}
      style={({pressed}) => [styles.item, pressed && styles.pressed]}>
      <View style={[styles.cap, {backgroundColor: colors.grey2}]} />
      <View style={[styles.body, {backgroundColor: colors.grey1}]}>
        <Animated.View
          style={[
            styles.liquid,
            {
              height: level,
              backgroundColor: color,
              transform: [{scaleY: fill}],
            },
          ]}>
          <View style={[styles.bubble, styles.bubbleA, shine]} />
          <View style={[styles.bubble, styles.bubbleB, shine]} />
        </Animated.View>
        {PLEATS.map(p => (
          <View key={p} style={[styles.pleat, shine, {top: BODY_H * p}]} />
        ))}
      </View>
      <FText typo="bodyLabel04" color={colors.title}>
        {code}
      </FText>
      <FText typo="bodyLabel03" color={color}>
        {percent}%
      </FText>
    </Pressable>
  );
};

export default FilterCartridge;

const styles = StyleSheet.create({
  item: {
    alignItems: 'center',
    gap: tokens.spacing._3xs,
  },
  pressed: {
    transform: [{scale: 0.95}],
  },
  cap: {
    width: 24,
    height: 8,
    borderTopLeftRadius: tokens.borderRadius.small,
    borderTopRightRadius: tokens.borderRadius.small,
  },
  body: {
    width: 44,
    height: BODY_H,
    borderRadius: tokens.borderRadius.medium,
    overflow: 'hidden',
  },
  liquid: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.9,
    transformOrigin: 'bottom',
  },
  pleat: {
    position: 'absolute',
    left: 8,
    right: 8,
    height: 1,
    opacity: 0.45,
  },
  bubble: {
    position: 'absolute',
    borderRadius: tokens.borderRadius.full,
    opacity: 0.5,
  },
  bubbleA: {
    width: 5,
    height: 5,
    bottom: 10,
    left: 12,
  },
  bubbleB: {
    width: 3,
    height: 3,
    bottom: 22,
    right: 12,
  },
});
