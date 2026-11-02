import React from 'react';
import {StyleSheet, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {ColorsProps, useTheme} from '@/core/theme';
import {
  FText,
  WaterWaveBackground,
  waveBackgroundColor,
} from '@/shared/components';
import {tokens} from '@/shared/styles';
import {ConnectedDeviceData} from '@/features/home/presentation/mocks/mockHome';

interface ConnectedDevicePanelProps {
  data: ConnectedDeviceData;
}

const ConnectedDevicePanel: React.FC<ConnectedDevicePanelProps> = ({data}) => {
  const {t} = useTranslation();
  const {theme, isDark} = useTheme();
  const {colors} = theme;
  const styles = createStyles(colors);

  return (
    <View style={styles.container} testID="device-panel">
      <View style={styles.cardWrap}>
        {/* wave paths start at the crest, so the card needs a status base
            color behind them to avoid showing the screen background */}
        <View
          style={[
            styles.card,
            {backgroundColor: waveBackgroundColor(data.status, isDark)},
          ]}>
          <WaterWaveBackground status={data.status} waterLevel={0.45} />
          <View style={styles.cardContent}>
            <View style={styles.qualityRow}>
              <View>
                <FText
                  typo="bodyLabel02"
                  color={isDark ? colors.onDarkSecondary : colors.subtitle}>
                  {t('home.device.quality')}
                </FText>
                <FText
                  typo="headline7"
                  color={colors.title}>
                  {data.qualityLabel}
                </FText>
              </View>
              <View style={styles.gradeBlock}>
                <FText
                  typo="headline5"
                  color={isDark ? colors.title : colors.success}>
                  {data.grade}
                </FText>
                <FText
                  typo="bodyLabel02"
                  color={isDark ? colors.title : colors.success}>
                  {data.gradePpm} ppm
                </FText>
              </View>
            </View>
            <View style={styles.statsRow}>
              {[
                {value: data.stats.inputPpm, label: t('home.device.statInput')},
                {
                  value: data.stats.efficiency,
                  label: t('home.device.statEfficiency'),
                },
                {
                  value: data.stats.filtered,
                  label: t('home.device.statFiltered'),
                },
              ].map(stat => (
                <View
                  key={stat.label}
                  style={[
                    styles.statPill,
                    isDark && styles.statPillDark,
                  ]}>
                  <FText
                    typo="bodyLabel01"
                    color={colors.title}>
                    {stat.value}
                  </FText>
                  <FText
                    typo="bodyLabel04"
                    color={isDark ? colors.onDarkSecondary : colors.subtitle}>
                    {stat.label}
                  </FText>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default ConnectedDevicePanel;

const createStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    container: {
      gap: tokens.space.lg,
      marginBottom: tokens.space.lg,
    },
    cardWrap: {
      borderRadius: tokens.borderRadius.medium,
    },
    card: {
      borderRadius: tokens.borderRadius.medium,
      overflow: 'hidden',
    },
    cardContent: {
      padding: tokens.space.md,
      gap: tokens.space.md,
    },
    qualityRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    gradeBlock: {
      alignItems: 'flex-end',
    },
    statsRow: {
      flexDirection: 'row',
      gap: tokens.space.sm,
    },
    statPill: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: tokens.borderRadius.medium,
      alignItems: 'center',
      paddingVertical: tokens.spacing.xs,
      gap: tokens.spacing._3xs,
    },
    statPillDark: {
      backgroundColor: colors.bgDarkOver,
    },
  });
