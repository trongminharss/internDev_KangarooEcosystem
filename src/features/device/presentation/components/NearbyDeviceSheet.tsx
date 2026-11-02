import React, {useEffect, useMemo, useRef} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ColorsProps, useTheme} from '@/core/theme';
import {FBottomSheet, FBottomSheetRef, FIcon, FText} from '@/shared/components';
import {FOutlined, tokens} from '@/shared/styles';
import {DiscoveredDevice, findDeviceModel} from '../../domain/entities/Device';
import {WaterPurifier3D} from './WaterPurifier3D';

/** AirTag-style card: a device in pairing mode is nearby — one tap to connect. */
export const NearbyDeviceSheet: React.FC<{
  device: DiscoveredDevice | null;
  visible: boolean;
  onClose: () => void;
  /** Runs after the sheet has fully closed. */
  onConnect: (device: DiscoveredDevice) => void;
}> = ({device, visible, onClose, onConnect}) => {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const {theme} = useTheme();
  const {colors} = theme;
  const styles = useMemo(() => createStyles(colors), [colors]);
  const sheetRef = useRef<FBottomSheetRef>(null);
  // navigate only once the sheet has fully dismissed, not mid-animation
  const connectOnHide = useRef(false);
  const open = visible && !!device;

  useEffect(() => {
    if (open) {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [open]);

  return (
    <FBottomSheet
      ref={sheetRef}
      detached
      bottomInset={insets.bottom + tokens.spacing.xs}
      onClose={() => {
        onClose();
        if (connectOnHide.current && device) {
          connectOnHide.current = false;
          onConnect(device);
        }
      }}
      style={styles.card}>
      {device && (
        <View style={styles.body}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('device.nearby.close')}
            hitSlop={8}
            onPress={() => sheetRef.current?.dismiss()}
            style={({pressed}) => [styles.close, pressed && styles.pressed]}>
            <FIcon
              icon={FOutlined.e_remove}
              size={14}
              iconColor={colors.body}
            />
          </Pressable>

          <View style={styles.header}>
            <FText typo="headline7" style={styles.center}>
              {findDeviceModel(device.modelId)?.name ?? device.name}
            </FText>
            <FText typo="body04" color={colors.subtitle} style={styles.center}>
              {device.name}
            </FText>
          </View>

          <WaterPurifier3D />

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              connectOnHide.current = true;
              sheetRef.current?.dismiss();
            }}
            style={({pressed}) => [styles.connect, pressed && styles.pressed]}>
            <FText typo="bodyLabel02">{t('device.nearby.connect')}</FText>
          </Pressable>
        </View>
      )}
    </FBottomSheet>
  );
};

export default NearbyDeviceSheet;

const createStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    card: {
      marginHorizontal: tokens.spacing.xs,
      borderRadius: tokens.borderRadius.big,
    },
    body: {
      alignSelf: 'stretch',
      alignItems: 'center',
      gap: tokens.space.md,
      paddingHorizontal: tokens.space.md,
      paddingTop: tokens.spacing.xs,
      paddingBottom: tokens.space.md,
    },
    close: {
      position: 'absolute',
      top: 0,
      right: tokens.space.md,
      width: 28,
      height: 28,
      borderRadius: tokens.borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.grey1,
      zIndex: 1,
    },
    header: {
      gap: tokens.spacing._3xs,
      paddingHorizontal: tokens.space.xl,
    },
    center: {
      textAlign: 'center',
    },
    connect: {
      alignSelf: 'stretch',
      height: 52,
      borderRadius: tokens.borderRadius.medium,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.grey1,
    },
    pressed: {
      transform: [{scale: 0.97}],
    },
  });
