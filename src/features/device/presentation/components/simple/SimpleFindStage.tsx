import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Animated, Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {ColorsProps, useTheme} from '@/core/theme';
import {FIcon, FText} from '@/shared/components';
import {FOutlined, tokens} from '@/shared/styles';
import {
  DEVICE_CATALOG,
  DiscoveredDevice,
  findDeviceModel,
} from '../../../domain/entities/Device';
import {useDevicePermissions} from '../../hooks/useDevicePermissions';
import {formatSeconds, useDeviceScan} from '../../hooks/useDeviceScan';
import {MODEL_ICONS} from '../../screens/AddDeviceScreen';
import {CircleButton, EASE, FadeIn, Halo} from './SimpleUi';

interface FindProps {
  onSelect: (device: DiscoveredDevice) => void;
  onManual: (modelId: string) => void;
}

interface ScanView {
  scanning: boolean;
  devices: DiscoveredDevice[];
  seconds: number;
  isDone: boolean;
  rescan: () => void;
}

const IDLE: ScanView = {
  scanning: false,
  devices: [],
  seconds: 0,
  isDone: false,
  rescan: () => {},
};

/** Stage 1: one switch to scan, a tap-to-pick list, and the catalog below it. */
export const SimpleFindStage: React.FC<FindProps> = props => {
  const {status, allGranted, anyBlocked, request, openSettings} =
    useDevicePermissions();
  const [on, setOn] = useState(true);
  const [scan, setScan] = useState<ScanView>(IDLE);

  if (status === null) {
    return null;
  }
  // without permissions the switch doubles as the "grant" action
  const toggle = !allGranted
    ? anyBlocked
      ? openSettings
      : request
    : () => setOn(v => !v);
  const live = allGranted && on;

  return (
    <>
      {live && <ScanProbe onChange={setScan} />}
      <FindLayout
        {...props}
        onManual={allGranted ? props.onManual : () => toggle()}
        on={live}
        needsPermission={!allGranted}
        onToggle={toggle}
        scan={live ? scan : IDLE}
      />
    </>
  );
};

// mounted only while the switch is on, so turning it on always starts a fresh scan
const ScanProbe: React.FC<{onChange: (scan: ScanView) => void}> = ({
  onChange,
}) => {
  const {devices, seconds, isScanning, isDone, rescan} = useDeviceScan();
  useEffect(
    () => onChange({scanning: isScanning, devices, seconds, isDone, rescan}),
    [onChange, isScanning, devices, seconds, isDone, rescan],
  );
  useEffect(() => () => onChange(IDLE), [onChange]);
  return null;
};

const FindLayout: React.FC<
  FindProps & {
    on: boolean;
    needsPermission: boolean;
    onToggle: () => void;
    scan: ScanView;
  }
> = ({onSelect, onManual, on, needsPermission, onToggle, scan}) => {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const {colors} = theme;
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <FadeIn>
        <FText typo="headline6">{t('device.simple.title')}</FText>
      </FadeIn>

      <FadeIn delay={80} style={styles.scanCard}>
        <View style={styles.scanHead}>
          <FText typo="bodyLabel02" style={styles.flex}>
            {t('device.simple.bluetooth')}
          </FText>
          <Toggle value={on} onPress={onToggle} />
        </View>
        <View style={styles.center}>
          <Halo size={112} active={scan.scanning}>
            <View style={styles.btCore}>
              <FIcon
                icon={FOutlined.bluetooth}
                size={24}
                iconColor={on ? colors.primary : colors.title}
              />
            </View>
          </Halo>
        </View>
        <View style={styles.scanText}>
          <FText typo="bodyLabel03">
            {needsPermission
              ? t('device.simple.permission')
              : t('device.simple.nearby')}
          </FText>
          <FText typo="body04" color={colors.subtitle}>
            {needsPermission
              ? t('device.simple.permissionHint')
              : t('device.simple.nearbyHint')}
          </FText>
        </View>
      </FadeIn>

      <FadeIn delay={160} style={styles.section}>
        <View style={styles.sectionHead}>
          <FText typo="headline8" style={styles.flex}>
            {t('device.simple.available')}
          </FText>
          {scan.scanning && (
            <FText typo="body04" color={colors.subtitle}>
              {formatSeconds(scan.seconds)}
            </FText>
          )}
          {on && scan.isDone && (
            <CircleButton
              icon={FOutlined.refresh}
              accessibilityLabel={t('device.scan.rescan')}
              onPress={scan.rescan}
              style={styles.refresh}
            />
          )}
        </View>
        {scan.devices.length === 0 ? (
          <View style={styles.empty}>
            <FText typo="body04" color={colors.subtitle}>
              {!on
                ? t('device.simple.off')
                : scan.isDone
                ? t('device.scan.notFound')
                : t('device.scan.searching')}
            </FText>
          </View>
        ) : (
          scan.devices.map(device => (
            <DeviceRow
              key={device.id}
              device={device}
              onPress={() => onSelect(device)}
            />
          ))
        )}
      </FadeIn>

      <FadeIn delay={240} style={styles.section}>
        <FText typo="headline8">{t('device.simple.manual')}</FText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catalog}>
          {DEVICE_CATALOG.map(model => (
            <Pressable
              key={model.id}
              accessibilityRole="button"
              onPress={() => onManual(model.id)}
              style={({pressed}) => [styles.model, pressed && styles.pressed]}>
              <View style={styles.iconCircle}>
                <FIcon
                  icon={MODEL_ICONS[model.id] ?? FOutlined.device_connection}
                  size={22}
                  iconColor={colors.title}
                />
              </View>
              <FText typo="bodyLabel04" numberOfLines={2}>
                {model.name}
              </FText>
            </Pressable>
          ))}
        </ScrollView>
      </FadeIn>
    </ScrollView>
  );
};

const DeviceRow: React.FC<{device: DiscoveredDevice; onPress: () => void}> = ({
  device,
  onPress,
}) => {
  const {theme} = useTheme();
  const {colors} = theme;
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <FadeIn>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({pressed}) => [styles.row, pressed && styles.pressed]}>
        <View style={styles.iconCircle}>
          <FIcon
            icon={MODEL_ICONS[device.modelId] ?? FOutlined.device_connection}
            size={22}
            iconColor={colors.title}
          />
        </View>
        <View style={styles.flex}>
          <FText typo="bodyLabel02" numberOfLines={1}>
            {device.name}
          </FText>
          <FText typo="body04" color={colors.subtitle} numberOfLines={1}>
            {findDeviceModel(device.modelId)?.name ?? ''}
          </FText>
        </View>
        <FIcon
          icon={FOutlined.arrown_right}
          size={20}
          iconColor={colors.body}
        />
      </Pressable>
    </FadeIn>
  );
};

/** Pill switch whose knob glides with the shared ease-out. */
const Toggle: React.FC<{value: boolean; onPress: () => void}> = ({
  value,
  onPress,
}) => {
  const {theme} = useTheme();
  const {colors} = theme;
  const styles = useMemo(() => createStyles(colors), [colors]);
  const x = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(x, {
      toValue: value ? 1 : 0,
      duration: 350,
      easing: EASE,
      useNativeDriver: true,
    }).start();
  }, [value, x]);

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{checked: value}}
      onPress={onPress}
      hitSlop={8}
      style={[styles.track, value && styles.trackOn]}>
      <Animated.View
        style={[
          styles.knob,
          {
            transform: [
              // track 52 − knob 24 − 2×2 inset
              {
                translateX: x.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 24],
                }),
              },
            ],
          },
        ]}
      />
    </Pressable>
  );
};

export default SimpleFindStage;

const createStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    flex: {
      flex: 1,
    },
    content: {
      paddingHorizontal: tokens.space.md,
      paddingTop: tokens.space.sm,
      paddingBottom: tokens.space._2xl,
      gap: tokens.space.lg,
    },
    scanCard: {
      padding: tokens.spacing.s,
      borderRadius: tokens.borderRadius.medium + tokens.spacing._2xs,
      backgroundColor: colors.grey1,
      gap: tokens.spacing._2xs,
    },
    scanHead: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    btCore: {
      width: 56,
      height: 56,
      borderRadius: tokens.borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.white,
    },
    center: {
      alignItems: 'center',
    },
    scanText: {
      gap: tokens.spacing._3xs,
    },
    section: {
      gap: tokens.spacing.xs,
    },
    sectionHead: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.spacing._2xs,
      minHeight: 40,
    },
    refresh: {
      width: 40,
      height: 40,
    },
    empty: {
      paddingVertical: tokens.space.lg,
      alignItems: 'center',
      borderRadius: tokens.borderRadius.medium,
      backgroundColor: colors.grey1,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.spacing.xs,
      padding: tokens.spacing.xs,
      borderRadius: tokens.borderRadius.medium,
      backgroundColor: colors.grey1,
    },
    iconCircle: {
      width: 44,
      height: 44,
      borderRadius: tokens.borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.white,
    },
    catalog: {
      gap: tokens.spacing._2xs,
    },
    model: {
      width: 112,
      padding: tokens.spacing.xs,
      gap: tokens.spacing._2xs,
      borderRadius: tokens.borderRadius.medium,
      backgroundColor: colors.grey1,
    },
    pressed: {
      transform: [{scale: 0.97}],
    },
    track: {
      width: 52,
      height: 28,
      padding: 2, // geometry-coupled with the knob travel below
      borderRadius: tokens.borderRadius.full,
      backgroundColor: colors.grey2,
    },
    trackOn: {
      backgroundColor: colors.title,
    },
    knob: {
      width: 24,
      height: 24,
      borderRadius: tokens.borderRadius.full,
      backgroundColor: colors.white,
    },
  });
