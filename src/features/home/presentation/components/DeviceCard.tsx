import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {ColorsProps, useTheme} from '@/core/theme';
import {FIcon, FText} from '@/shared/components';
import {FFilled, tokens} from '@/shared/styles';
import {MockDevice} from '@/features/home/presentation/mocks/mockHome';

interface DeviceCardProps {
  device: MockDevice;
  onPress: () => void;
}

const DeviceCard: React.FC<DeviceCardProps> = ({device, onPress}) => {
  const {theme} = useTheme();
  const {colors} = theme;
  const styles = createStyles(colors);

  return (
    <Pressable
      style={styles.card}
      testID={`device-card-${device.id}`}
      accessibilityRole="button"
      accessibilityLabel={device.name}
      onPress={onPress}>
      <View style={styles.iconWrap}>
        {/* ponytail: placeholder until real device icons ship */}
        <FIcon icon={FFilled.settings} size={24} iconColor={colors.success} />
      </View>
      <FText typo="bodyLabel04" color={colors.subtitle}>
        {device.room}
      </FText>
      <FText typo="bodyLabel02" numberOfLines={1}>
        {device.name}
      </FText>
      <View style={styles.statusRow}>
        <View style={styles.dot} />
        <FText typo="bodyLabel04" color={colors.subtitle}>
          {device.statusText}
        </FText>
      </View>
    </Pressable>
  );
};

export default DeviceCard;

const createStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    card: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: tokens.borderRadius.medium,
      padding: tokens.space.sm,
      gap: tokens.spacing._3xs,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: tokens.borderRadius.small,
      backgroundColor: colors.successBackground,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: tokens.spacing._2xs,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.spacing._3xs,
      marginTop: tokens.spacing._2xs,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: tokens.borderRadius.full,
      backgroundColor: colors.success,
    },
  });
