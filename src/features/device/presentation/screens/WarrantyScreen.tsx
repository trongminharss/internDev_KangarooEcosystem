import React, {useMemo} from 'react';
import {Linking, ScrollView, StyleSheet, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {ColorsProps, useTheme} from '@/core/theme';
import {FDate} from '@/core/utils/date';
import {FAppbar, FButton, FIcon, FText} from '@/shared/components';
import {FFilled, FOutlined, tokens} from '@/shared/styles';
import {useAppNavigation} from '@/app/navigation/types';
import {PURIFIER_MOCK} from '../purifierMock';

const COVERAGE = ['board', 'defect', 'labor'];
const EXCLUDED = ['filters', 'damage'];

export const WarrantyScreen: React.FC = () => {
  const {theme} = useTheme();
  const {colors} = theme;
  const {t} = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation = useAppNavigation();
  const d = PURIFIER_MOCK;
  const daysLeft = FDate.daysUntil(d.purchasedAt, d.warrantyMonths);
  const valid = daysLeft >= 0;

  return (
    <View style={styles.container}>
      <FAppbar
        title={t('device.warranty.title')}
        onBack={navigation.goBack}
        showLanguage={false}
        showLanguageSelector={false}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View
          style={[
            styles.card,
            {backgroundColor: valid ? colors.primary : colors.grey600},
          ]}>
          <View style={styles.cardTop}>
            <FIcon
              icon={FFilled.shield}
              size={28}
              iconColor={colors.onDarkPrimary}
            />
            <FText typo="bodyLabel03" color={colors.onDarkPrimary}>
              {valid
                ? t('device.warranty.valid', {count: daysLeft})
                : t('device.warranty.expired')}
            </FText>
          </View>
          <FText typo="headline6" color={colors.onDarkPrimary}>
            {d.name}
          </FText>
          <View style={styles.grid}>
            {[
              [t('device.snapshot.model'), d.model],
              [t('device.snapshot.serial'), d.serial],
              [t('device.warranty.purchased'), FDate.dMy(d.purchasedAt)],
              [
                t('device.warranty.expires'),
                FDate.addMonthsDMy(d.purchasedAt, d.warrantyMonths),
              ],
            ].map(([k, v]) => (
              <View key={k} style={styles.cell}>
                <FText typo="body05" color={colors.onDarkSecondary}>
                  {k}
                </FText>
                <FText typo="bodyLabel03" color={colors.onDarkPrimary}>
                  {v}
                </FText>
              </View>
            ))}
          </View>
        </View>

        {[
          {
            title: t('device.warranty.covered'),
            items: COVERAGE.map(k => t(`device.warranty.coverage.${k}`)),
            icon: FFilled.c_check,
            tint: colors.primary,
          },
          {
            title: t('device.warranty.excluded'),
            items: EXCLUDED.map(k => t(`device.warranty.exclusions.${k}`)),
            icon: FFilled.c_remove,
            tint: colors.subtitle,
          },
        ].map(g => (
          <View key={g.title} style={styles.group}>
            <FText typo="headline8" color={colors.title}>
              {g.title}
            </FText>
            {g.items.map(it => (
              <View key={it} style={styles.item}>
                <FIcon icon={g.icon} size={18} iconColor={g.tint} />
                <FText typo="body03" color={colors.title} style={styles.flex}>
                  {it}
                </FText>
              </View>
            ))}
          </View>
        ))}

        <FButton
          kind="secondary"
          color="success"
          width="block"
          onPress={() => Linking.openURL(`tel:${d.hotline}`)}>
          <FButton.Icon icon={FOutlined.phone_call} size={20} />
          <FButton.Label>{t('device.warranty.call')}</FButton.Label>
        </FButton>
      </ScrollView>
    </View>
  );
};

export default WarrantyScreen;

const createStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: tokens.space.md,
      gap: tokens.space.lg,
    },
    card: {
      borderRadius: tokens.borderRadius.medium,
      padding: tokens.spacing.s,
      gap: tokens.spacing.xs,
    },
    cardTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      rowGap: tokens.spacing.xs,
    },
    cell: {
      width: '50%',
    },
    group: {
      gap: tokens.spacing._2xs,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.spacing._2xs,
    },
    flex: {
      flex: 1,
    },
  });
