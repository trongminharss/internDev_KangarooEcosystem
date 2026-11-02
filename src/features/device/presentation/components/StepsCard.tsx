import React, {useMemo} from 'react';
import {StyleSheet, View, ViewStyle} from 'react-native';
import {ColorsProps, useTheme} from '@/core/theme';
import {FText} from '@/shared/components';
import {tokens} from '@/shared/styles';

interface StepsCardProps {
  title?: string;
  steps: string[];
  style?: ViewStyle;
}

/** Flat bordered card with numbered steps (pairing tips, reset guide, permission guide). */
export const StepsCard: React.FC<StepsCardProps> = ({title, steps, style}) => {
  const {theme} = useTheme();
  const {colors} = theme;
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.card, style]}>
      {title ? (
        <FText typo="bodyLabel03" style={styles.title}>
          {title}
        </FText>
      ) : null}
      {steps.map((step, i) => (
        <View key={step} style={styles.row}>
          <View style={styles.badge}>
            <FText typo="bodyLabel04" color={colors.primary}>
              {i + 1}
            </FText>
          </View>
          <FText typo="body03" color={colors.subtitle} style={styles.text}>
            {step}
          </FText>
        </View>
      ))}
    </View>
  );
};

export default StepsCard;

const createStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.border1,
      borderRadius: tokens.borderRadius.medium,
      padding: tokens.spacing.s,
      gap: tokens.spacing.xs,
    },
    title: {
      color: colors.title,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: tokens.spacing.xs,
    },
    badge: {
      width: 22,
      height: 22,
      borderRadius: tokens.borderRadius.full,
      backgroundColor: colors.primaryBackground,
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: {
      flex: 1,
    },
  });
