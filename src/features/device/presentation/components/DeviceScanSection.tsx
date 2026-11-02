import React, {useEffect, useMemo, useRef} from 'react';
import {Animated, StyleSheet, TouchableOpacity, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {ColorsProps, useTheme} from '@/core/theme';
import {FButton, FIcon, FText} from '@/shared/components';
import {FOutlined, tokens} from '@/shared/styles';
import {DiscoveredDevice, signalLevel} from '../../domain/entities/Device';
import {formatSeconds, useDeviceScan} from '../hooks/useDeviceScan';
import {ScanRadar} from './ScanRadar';

interface DeviceScanSectionProps {
  /** Only list devices of this model (manual flow). */
  modelId?: string;
  onSelect: (device: DiscoveredDevice) => void;
}

/** Radar + 2-minute countdown + found-device list + rescan. */
export const DeviceScanSection: React.FC<DeviceScanSectionProps> = ({
  modelId,
  onSelect,
}) => {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const {colors} = theme;
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {devices, seconds, isDone, rescan} = useDeviceScan(modelId);

  return (
    <View style={styles.section}>
      <ScanRadar active={!isDone} />
      <View style={styles.status}>
        <FText typo="bodyLabel02" style={styles.center}>
          {isDone ? t('device.scan.stopped') : t('device.scan.searching')}
        </FText>
        {!isDone && (
          <FText typo="body03" color={colors.subtitle} style={styles.center}>
            {t('device.scan.timeLeft', {time: formatSeconds(seconds)})}
          </FText>
        )}
      </View>

      {devices.length > 0 ? (
        <View style={styles.list}>
          <FText typo="bodyLabel04" color={colors.subtitle}>
            {t('device.scan.found').toUpperCase()}
          </FText>
          {devices.map(device => (
            <DeviceRow
              key={device.id}
              device={device}
              onPress={() => onSelect(device)}
            />
          ))}
        </View>
      ) : (
        <FText typo="body03" color={colors.body} style={styles.center}>
          {isDone ? t('device.scan.notFound') : t('device.scan.empty')}
        </FText>
      )}

      {isDone && (
        <FButton
          kind="tertiary"
          size="m"
          style={styles.rescan}
          onPress={rescan}>
          <FButton.Icon icon={FOutlined.refresh} />
          <FButton.Label>{t('device.scan.rescan')}</FButton.Label>
        </FButton>
      )}
    </View>
  );
};

const DeviceRow: React.FC<{device: DiscoveredDevice; onPress: () => void}> = ({
  device,
  onPress,
}) => {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const {colors} = theme;
  const styles = useMemo(() => createStyles(colors), [colors]);
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 360,
      useNativeDriver: true,
    }).start();
  }, [enter]);

  const translateY = enter.interpolate({
    inputRange: [0, 1],
    outputRange: [8, 0],
  });

  return (
    <Animated.View style={{opacity: enter, transform: [{translateY}]}}>
      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.row}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={device.name}>
        <View style={styles.iconWrap}>
          <FIcon
            icon={FOutlined.device_connection}
            size={22}
            iconColor={colors.primary}
          />
        </View>
        <View style={styles.rowText}>
          <FText typo="bodyLabel03" numberOfLines={1}>
            {device.name}
          </FText>
          <FText typo="body04" color={colors.subtitle}>
            {t(`device.scan.signal.${signalLevel(device.rssi)}`)}
          </FText>
        </View>
        <FIcon icon={FOutlined.right_arrow} size={20} iconColor={colors.body} />
      </TouchableOpacity>
    </Animated.View>
  );
};

export default DeviceScanSection;

const createStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    section: {
      gap: tokens.space.md,
    },
    status: {
      gap: tokens.spacing._3xs,
    },
    center: {
      textAlign: 'center',
    },
    list: {
      gap: tokens.spacing._2xs,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.spacing.xs,
      padding: tokens.spacing.xs,
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.border1,
      borderRadius: tokens.borderRadius.medium,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: tokens.borderRadius.small,
      backgroundColor: colors.primaryBackground,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowText: {
      flex: 1,
    },
    rescan: {
      alignSelf: 'center',
    },
  });
