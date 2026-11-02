import React from 'react';
import {StyleSheet, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {ColorsProps, useTheme} from '@/core/theme';
import {FAppbar, FText} from '@/shared/components';
import {tokens} from '@/shared/styles';

export const AutomationScreen: React.FC = () => {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const {colors} = theme;
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <FAppbar title={t('tab.automation')} noContent />
      <View style={styles.content}>
        <FText typo="headline7" style={styles.title}>
          {t('tab.automation')}
        </FText>
        <FText typo="body02" style={styles.subtitle}>
          Quản lý kịch bản tự động hóa và ngữ cảnh thiết bị
        </FText>
      </View>
    </View>
  );
};

export default AutomationScreen;

const createStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.white,
    },
    content: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
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
