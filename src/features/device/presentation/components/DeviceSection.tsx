import React, {ReactNode} from 'react';
import {StyleSheet, View, ViewStyle} from 'react-native';
import {useTheme} from '@/core/theme';
import {FText} from '@/shared/components';
import {tokens} from '@/shared/styles';

interface Props {
  title: string;
  right?: ReactNode;
  children: ReactNode;
  style?: ViewStyle;
}

/** Titled card used by every block on the device detail screen. */
export const DeviceSection: React.FC<Props> = ({
  title,
  right,
  children,
  style,
}) => {
  const {theme} = useTheme();
  const {colors} = theme;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <FText typo="headline8" color={colors.title}>
          {title}
        </FText>
        {right}
      </View>
      <View style={[styles.card, {backgroundColor: colors.white}, style]}>
        {children}
      </View>
    </View>
  );
};

export default DeviceSection;

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: tokens.space.md,
    paddingTop: tokens.space.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing._2xs,
  },
  card: {
    borderRadius: tokens.borderRadius.medium,
    padding: tokens.spacing.s,
    gap: tokens.spacing.xs,
  },
});
