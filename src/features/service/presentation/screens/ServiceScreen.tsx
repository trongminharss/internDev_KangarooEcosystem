import React from 'react';
import {StyleSheet, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {ColorsProps, useTheme} from '@/core/theme';
import {FAppbar} from '@/shared/components';
import {tokens} from '@/shared/styles';
import { AccountScreen } from '@/features/account';

export const ServiceScreen: React.FC = () => {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const {colors} = theme;
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <FAppbar title={t('tab.service')} noContent />
      <View style={styles.content}>
       <AccountScreen/>
      </View>
    </View>
  );
};

export default ServiceScreen;

const createStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.white,
    },
    content: {
      width: '100%',
      flex: 1,
      paddingHorizontal: tokens.space.md,
    },
    title: {
      color: colors.title,
      marginBottom: tokens.spacing.xs,
    },
    subtitle: {
      color: colors.subtitle,
      textAlign: 'center',
    },
  });
