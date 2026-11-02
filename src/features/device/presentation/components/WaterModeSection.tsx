import React, {useMemo} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {ColorsProps, useTheme} from '@/core/theme';
import {FIcon, FText} from '@/shared/components';
import {FOutlined, tokens} from '@/shared/styles';
import {DeviceSection} from './DeviceSection';
import {SCALE, palettes} from './WaterModePanel';
import {WaterChannel} from '../hooks/usePurifier';
import {WaterChannelKey, tempMood} from '../purifierUtils';

interface Props {
  hot: WaterChannel;
  cold: WaterChannel;
  ecoOn: boolean;
  onOpen: (channel: WaterChannelKey) => void;
}

const fmt = (t: number) => String(t).replace('.', ',');

/** Compact overview card; tapping opens the full water-mode screen. */
export const WaterModeSection: React.FC<Props> = ({
  hot,
  cold,
  ecoOn,
  onOpen,
}) => {
  const {theme} = useTheme();
  const {colors} = theme;
  const {t} = useTranslation();
  const s = useMemo(() => createStyles(colors), [colors]);
  const pal = palettes(colors);
  // Headline the hot channel unless it is off and cold is running.
  const main: WaterChannelKey = !hot.on && cold.on ? 'cold' : 'hot';
  const other: WaterChannelKey = main === 'hot' ? 'cold' : 'hot';
  const ch = {hot, cold};
  const title = (k: WaterChannelKey) => t(`device.waterMode.${k}.title`);
  const accent = ch[main].on ? pal[main].mid : colors.disable;

  const statuses = [
    {key: 'hot' as const, icon: SCALE.hot.icon, on: hot.on, tint: pal.hot.mid},
    {
      key: 'cold' as const,
      icon: SCALE.cold.icon,
      on: cold.on,
      tint: pal.cold.mid,
    },
  ];

  return (
    <DeviceSection title={t('device.waterMode.title')} style={s.bare}>
      <View style={s.card}>
        <View style={s.rail}>
          {statuses.map(st => (
            <Pressable
              key={st.key}
              hitSlop={8}
              accessibilityLabel={t('device.waterMode.openChannel', {
                channel: title(st.key).toLowerCase(),
              })}
              onPress={() => onOpen(st.key)}>
              <FIcon
                icon={st.icon}
                size={22}
                iconColor={st.on ? st.tint : colors.placeHolder}
              />
            </Pressable>
          ))}
          <FIcon
            icon={FOutlined.moon_stars}
            size={20}
            iconColor={ecoOn ? colors.warningNormal : colors.placeHolder}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('device.waterMode.openControl')}
          onPress={() => onOpen(main)}
          style={({pressed}) => [s.body, pressed && s.pressed]}>
          <View style={s.info}>
            <FText typo="body05" color={colors.subtitle}>
              {title(main).toUpperCase()}
            </FText>
            {ch[main].on ? (
              <View style={s.big}>
                <FText typo="headline3" color={colors.title}>
                  {fmt(ch[main].temp)}
                </FText>
                <FText typo="headline8" color={colors.title}>
                  °C
                </FText>
              </View>
            ) : (
              <FText typo="headline5" color={colors.subtitle}>
                {t('device.waterMode.offStatus')}
              </FText>
            )}
            <FText typo="body04" color={colors.body}>
              {ch[main].on
                ? t(`device.waterMode.mood.${tempMood(main, ch[main].temp)}`)
                : t('device.waterMode.bothOff')}
            </FText>
            <View style={s.meta}>
              <FText typo="body04" color={colors.subtitle}>
                {title(other)}
              </FText>
              <FText typo="bodyLabel04" color={colors.title}>
                {ch[other].on
                  ? `${fmt(ch[other].temp)}°C`
                  : t('device.waterMode.off')}
              </FText>
              <View style={s.sep} />
              <FText typo="body04" color={colors.subtitle}>
                {t('device.waterMode.eco')}
              </FText>
              <FText typo="bodyLabel04" color={colors.title}>
                {ecoOn ? t('device.waterMode.on') : t('device.waterMode.off')}
              </FText>
            </View>
          </View>
          <View style={[s.accent, {backgroundColor: accent}]}>
            <FIcon
              icon={FOutlined.right_arrow}
              size={22}
              iconColor={ch[main].on ? colors.onDarkPrimary : colors.subtitle}
            />
          </View>
        </Pressable>
      </View>
    </DeviceSection>
  );
};

export default WaterModeSection;

const createStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    // The card below is the surface; drop DeviceSection's own card.
    bare: {
      padding: 0,
      backgroundColor: 'transparent',
    },
    card: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderRadius: tokens.borderRadius.medium,
      overflow: 'hidden',
      minHeight: 148,
    },
    rail: {
      width: 56,
      alignItems: 'center',
      justifyContent: 'center',
      gap: tokens.spacing.s,
      borderRightWidth: 1,
      borderRightColor: colors.border2,
    },
    body: {
      flex: 1,
      flexDirection: 'row',
    },
    pressed: {
      opacity: 0.85,
    },
    info: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: tokens.spacing.s,
      paddingVertical: tokens.spacing.xs,
      gap: tokens.spacing._3xs,
    },
    big: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: tokens.spacing._3xs,
    },
    meta: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: tokens.spacing._3xs,
      marginTop: tokens.spacing._3xs,
    },
    sep: {
      width: 1,
      height: 12,
      marginHorizontal: tokens.spacing._3xs,
      backgroundColor: colors.border2,
    },
    accent: {
      width: 56,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
