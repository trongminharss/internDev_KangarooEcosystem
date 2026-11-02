import React, {useMemo} from 'react';
import {StyleSheet, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {ColorsProps, useTheme} from '@/core/theme';
import {FButton, FIcon, FText} from '@/shared/components';
import {FOutlined, tokens} from '@/shared/styles';
import {
  PERMISSION_KEYS,
  PermissionKey,
  PermissionMap,
} from '../hooks/useDevicePermissions';
import {StepsCard} from './StepsCard';

const ICONS: Record<PermissionKey, string> = {
  bluetooth: FOutlined.bluetooth,
  wifi: FOutlined.wifi,
  location: FOutlined.location,
};

interface PermissionGateProps {
  status: PermissionMap;
  anyBlocked: boolean;
  onRequest: () => void;
  onOpenSettings: () => void;
}

/** Shown instead of the scan until every permission is granted. */
export const PermissionGate: React.FC<PermissionGateProps> = ({
  status,
  anyBlocked,
  onRequest,
  onOpenSettings,
}) => {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const {colors} = theme;
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <FText typo="headline8">{t('device.permission.title')}</FText>
        <FText typo="body03" color={colors.subtitle}>
          {t('device.permission.subtitle')}
        </FText>
      </View>

      <View style={styles.card}>
        {PERMISSION_KEYS.map((key, i) => {
          const granted = status[key] === 'granted';
          return (
            <View key={key} style={[styles.row, i > 0 && styles.divider]}>
              <View
                style={[styles.iconWrap, granted && styles.iconWrapGranted]}>
                <FIcon
                  icon={ICONS[key]}
                  size={22}
                  iconColor={granted ? colors.primary : colors.error}
                />
              </View>
              <View style={styles.rowText}>
                <FText typo="bodyLabel03">
                  {t(`device.permission.${key}`)}
                </FText>
                <FText typo="body04" color={colors.subtitle}>
                  {t(`device.permission.${key}Desc`)}
                </FText>
                <View style={styles.statusRow}>
                  <FIcon
                    icon={granted ? FOutlined.c_check : FOutlined.c_warning}
                    size={14}
                    iconColor={granted ? colors.primary : colors.error}
                  />
                  <FText
                    typo="body04"
                    color={granted ? colors.primary : colors.error}>
                    {t(`device.permission.${status[key]}`)}
                  </FText>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.warning}>
        <FIcon
          icon={FOutlined.c_warning}
          size={18}
          iconColor={colors.warning}
        />
        <FText typo="body03" color={colors.title} style={styles.rowText}>
          {t('device.permission.required')}
        </FText>
      </View>

      <StepsCard
        title={t('device.permission.guideTitle')}
        steps={[
          t('device.permission.guide1'),
          t('device.permission.guide2'),
          t('device.permission.guide3'),
          t('device.permission.guide4'),
        ]}
      />

      <FButton
        width="block"
        title={
          anyBlocked
            ? t('device.permission.openSettings')
            : t('device.permission.grant')
        }
        onPress={anyBlocked ? onOpenSettings : onRequest}
      />
    </View>
  );
};

export default PermissionGate;

const createStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    container: {
      gap: tokens.space.md,
    },
    header: {
      gap: tokens.spacing._3xs,
    },
    card: {
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.border1,
      borderRadius: tokens.borderRadius.medium,
      paddingHorizontal: tokens.spacing.s,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: tokens.spacing.xs,
      paddingVertical: tokens.spacing.s,
    },
    divider: {
      borderTopWidth: 1,
      borderTopColor: colors.border1,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: tokens.borderRadius.small,
      backgroundColor: colors.errorBackground,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconWrapGranted: {
      backgroundColor: colors.primaryBackground,
    },
    rowText: {
      flex: 1,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.spacing._3xs,
      marginTop: tokens.spacing._3xs,
    },
    warning: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: tokens.spacing._2xs,
      padding: tokens.spacing.xs,
      borderRadius: tokens.borderRadius.small,
      backgroundColor: colors.warningBackground,
    },
  });
