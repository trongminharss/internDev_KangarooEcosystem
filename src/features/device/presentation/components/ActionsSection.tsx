import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useTheme} from '@/core/theme';
import {FIcon, FText} from '@/shared/components';
import {FOutlined, tokens} from '@/shared/styles';
import {DeviceSection} from './DeviceSection';

export type DeviceAction =
  | 'feedback'
  | 'warranty'
  | 'maintenance'
  | 'chat'
  | 'call';

const ACTIONS: {key: DeviceAction; icon: string}[] = [
  {key: 'feedback', icon: FOutlined.comments},
  {key: 'warranty', icon: FOutlined.shield},
  {key: 'maintenance', icon: FOutlined.calender_date},
  {key: 'chat', icon: FOutlined.chat},
  {key: 'call', icon: FOutlined.phone_call},
];

export const ActionsSection: React.FC<{
  onAction: (a: DeviceAction) => void;
}> = ({onAction}) => {
  const {theme} = useTheme();
  const {colors} = theme;
  const {t} = useTranslation();

  return (
    <DeviceSection title={t('device.actions.title')} style={styles.card}>
      {ACTIONS.map((a, i) => (
        <Pressable
          key={a.key}
          onPress={() => onAction(a.key)}
          style={({pressed}) => [
            styles.row,
            i > 0 && {borderTopWidth: 1, borderTopColor: colors.border1},
            pressed && {backgroundColor: colors.grey1},
          ]}>
          <FIcon icon={a.icon} size={24} iconColor={colors.primary} />
          <View style={styles.flex}>
            <FText typo="bodyLabel03" color={colors.title}>
              {t(`device.actions.${a.key}.title`)}
            </FText>
            <FText typo="body04" color={colors.subtitle}>
              {t(`device.actions.${a.key}.hint`)}
            </FText>
          </View>
          <FIcon
            icon={FOutlined.right_arrow}
            size={18}
            iconColor={colors.subtitle}
          />
        </Pressable>
      ))}
    </DeviceSection>
  );
};

export default ActionsSection;

const styles = StyleSheet.create({
  card: {
    padding: 0,
    gap: 0,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
    paddingHorizontal: tokens.spacing.s,
    paddingVertical: tokens.spacing.xs,
  },
  flex: {
    flex: 1,
  },
});
