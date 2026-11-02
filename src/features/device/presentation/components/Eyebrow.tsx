import React from 'react';
import {StyleSheet, View} from 'react-native';
import {useTheme} from '@/core/theme';
import {FText} from '@/shared/components';
import {tokens} from '@/shared/styles';

/** Tiny tracked-out pill that sits above a stage headline. */
export const Eyebrow: React.FC<{
  label: string;
  color?: string;
  bg?: string;
}> = ({label, color, bg}) => {
  const {theme} = useTheme();
  const {colors} = theme;
  return (
    <View
      style={[styles.pill, {backgroundColor: bg ?? colors.primaryBackground}]}>
      <FText typo="body05" color={color ?? colors.primary} style={styles.text}>
        {label.toUpperCase()}
      </FText>
    </View>
  );
};

export default Eyebrow;

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: tokens.spacing.xs,
    paddingVertical: tokens.spacing._3xs,
    borderRadius: tokens.borderRadius.full,
  },
  text: {
    letterSpacing: 2,
  },
});
