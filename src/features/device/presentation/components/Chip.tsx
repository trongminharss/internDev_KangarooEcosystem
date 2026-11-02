import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {useTheme} from '@/core/theme';
import {FText} from '@/shared/components';
import {tokens} from '@/shared/styles';

interface Props {
  label: string;
  caption?: string;
  active: boolean;
  onPress: () => void;
  /** Idle fill; defaults to grey1 (use white on grey pages). */
  idleColor?: string;
}

/** Pill selector shared by presets, time slots, issues and locations. */
export const Chip: React.FC<Props> = ({
  label,
  caption,
  active,
  onPress,
  idleColor,
}) => {
  const {theme} = useTheme();
  const {colors} = theme;

  return (
    <Pressable
      onPress={onPress}
      style={({pressed}) => [
        styles.chip,
        {backgroundColor: active ? colors.primary : idleColor ?? colors.grey1},
        pressed && styles.pressed,
      ]}>
      {caption !== undefined && (
        <FText
          typo="body05"
          color={active ? colors.onDarkSecondary : colors.subtitle}>
          {caption}
        </FText>
      )}
      <FText
        typo="bodyLabel04"
        color={active ? colors.onDarkPrimary : colors.title}>
        {label}
      </FText>
    </Pressable>
  );
};

/** Two-to-four option segmented control. */
export const Segmented = <T extends string | number>({
  items,
  value,
  onChange,
}: {
  items: {key: T; label: string}[];
  value: T;
  onChange: (v: T) => void;
}) => {
  const {theme} = useTheme();
  const {colors} = theme;

  return (
    <View style={[styles.segmented, {backgroundColor: colors.grey1}]}>
      {items.map(it => {
        const active = it.key === value;
        return (
          <Pressable
            key={String(it.key)}
            onPress={() => onChange(it.key)}
            style={[styles.segment, active && {backgroundColor: colors.white}]}>
            <FText
              typo="bodyLabel04"
              color={active ? colors.title : colors.subtitle}>
              {it.label}
            </FText>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: tokens.spacing.xs,
    paddingVertical: tokens.spacing._2xs,
    borderRadius: tokens.borderRadius.full,
    alignItems: 'center',
  },
  pressed: {
    transform: [{scale: 0.97}],
  },
  segmented: {
    flexDirection: 'row',
    borderRadius: tokens.borderRadius.full,
    padding: tokens.spacing._3xs,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: tokens.spacing._2xs,
    borderRadius: tokens.borderRadius.full,
  },
});
