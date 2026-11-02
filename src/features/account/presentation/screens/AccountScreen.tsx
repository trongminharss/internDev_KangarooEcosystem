import React from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {LANGUAGES, useLanguage} from '@/core/i18n';
import {ColorsProps, ThemeMode, useTheme} from '@/core/theme';
import {FIcon, FText} from '@/shared/components';
import {tokens} from '@/shared/styles';
import {FFilled} from '@/shared/styles/FIconStyles';

import EnglishSvg from '@/assets/svg/english.svg';
import VietnamSvg from '@/assets/svg/vietnam.svg';

const OPTIONS: {mode: ThemeMode}[] = [
  {mode: 'light'},
  {mode: 'dark'},
  {mode: 'system'},
];

export const AccountScreen: React.FC = () => {
  const {t} = useTranslation();
  const {mode, setMode, theme} = useTheme();
  const {language, setLanguage} = useLanguage();
  const {colors} = theme;
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <FText typo="title1" style={styles.header}>
        {t('account.title')}
      </FText>
      <FText typo="subtitle2" style={styles.subHeader}>
        {t('account.interface')}
      </FText>
      {OPTIONS.map(option => {
        const selected = mode === option.mode;
        return (
          <TouchableOpacity
            key={option.mode}
            style={styles.row}
            onPress={() => setMode(option.mode)}>
            <FText
              typo="title6"
              style={{color: selected ? colors.primary : colors.body}}>
              {t(`account.${option.mode}`)}
            </FText>
            {selected && (
              <FIcon icon={FFilled.c_check} size={20} iconColor={colors.primary} />
            )}
          </TouchableOpacity>
        );
      })}
      <FText typo="subtitle2" style={styles.subHeader}>
        {t('account.language')}
      </FText>
      {LANGUAGES.map(option => {
        const selected = language === option.code;
        const Flag = option.code === 'vi' ? VietnamSvg : EnglishSvg;
        return (
          <TouchableOpacity
            key={option.code}
            style={styles.row}
            onPress={() => setLanguage(option.code)}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Flag width={26} height={26} style={{marginRight: tokens.spacing.xs}} />
              <FText
                typo="title6"
                style={{color: selected ? colors.primary : colors.body}}>
                {option.label}
              </FText>
            </View>
            {selected && (
              <FIcon icon={FFilled.c_check} size={20} iconColor={colors.primary} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default AccountScreen;

const createStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.white,
      paddingHorizontal: tokens.space.md,
      paddingTop: tokens.space.lg,
    },
    header: {
      color: colors.title,
    },
    subHeader: {
      color: colors.subtitle,
      marginTop: tokens.space.lg,
      marginBottom: tokens.space.sm,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: tokens.space.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border1,
    },
  });
