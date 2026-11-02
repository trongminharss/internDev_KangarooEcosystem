import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {ColorsProps, useTheme} from '@/core/theme';
import {useAppNavigation} from '@/app/navigation/types';
import {FButton, FIcon, FText} from '@/shared/components';
import {FFilled, tokens} from '@/shared/styles';
import EmptyDeviceCard from './EmptyDeviceCard';
import ConnectedDevicePanel from './ConnectedDevicePanel';
import {ConnectedDeviceData} from '@/features/home/presentation/mocks/mockHome';

export type RegionStatus = 'loading' | 'success' | 'error' | 'empty';

interface DeviceSectionProps {
  status: RegionStatus;
  data?: ConnectedDeviceData;
  onConnect: () => void;
  onRetry: () => void;
}

const DeviceSection: React.FC<DeviceSectionProps> = ({
  status,
  data,
  onConnect,
  onRetry,
}) => {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const {colors} = theme;
  const styles = createStyles(colors);

  if (status === 'loading') {
    return <View style={styles.skeleton} testID="device-skeleton" />;
  }
  if (status === 'empty') {
    return <EmptyDeviceCard onConnect={onConnect} />;
  }
  if (status === 'error') {
    return (
      <View style={styles.center} testID="device-error">
        <FText typo="body03" color={colors.error}>
          {t('home.device.error')}
        </FText>
        <FButton
          title={t('home.device.retry')}
          kind="ghost"
          color="error"
          size="m"
          testID="device-retry"
          onPress={onRetry}
        />
      </View>
    );
  }
  return data ? <ConnectedDevicePanel data={data} /> : null;
};

export default DeviceSection;

export const DeviceGridHeader: React.FC = () => {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const {colors} = theme;
  const navigation = useAppNavigation();

  return (
    <View style={headerStyles.row} testID="device-grid-header">
      <FText typo="bodyLabel01">{t('home.device.gridTitle')}</FText>
      <Pressable
        style={headerStyles.more}
        hitSlop={tokens.space.xs}
        testID="device-more"
        accessibilityRole="button"
        accessibilityLabel={t('home.device.more')}
        onPress={() => navigation.navigate('AddDevice')}>
        <FText typo="bodyLabel02" color={colors.success}>
          {t('home.device.more')}
        </FText>
        <FIcon icon={FFilled.c_add} size={20} iconColor={colors.success} />
      </Pressable>
    </View>
  );
};

const createStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    skeleton: {
      height: 140,
      borderRadius: tokens.borderRadius.medium,
      backgroundColor: colors.grey1,
      marginBottom: tokens.space.lg,
    },
    center: {
      alignItems: 'center',
      gap: tokens.space.sm,
      paddingVertical: tokens.space.xl,
      marginBottom: tokens.space.lg,
    },
  });

const headerStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.space.md,
  },
  more: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing._3xs,
  },
});
