import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {ColorsProps, useTheme} from '@/core/theme';
import {FIcon, FText} from '@/shared/components';
import {FFilled, FOutlined, tokens} from '@/shared/styles';
import {ScalePalette, ThermoScale} from './ThermoScale';
import {TempGlass} from './TempGlass';
import {WaterChannel} from '../hooks/usePurifier';
import {
  COLD_RANGE,
  HOT_RANGE,
  WaterChannelKey,
  isExtremeTemp,
  mixHex,
  rangeFraction,
  tempMood,
} from '../purifierUtils';

interface Props {
  hot: WaterChannel;
  cold: WaterChannel;
  setHotOn: (on: boolean) => void;
  setColdOn: (on: boolean) => void;
  setHotTemp: (v: number) => void;
  setColdTemp: (v: number) => void;
  active: WaterChannelKey;
  onActiveChange: (channel: WaterChannelKey) => void;
}

const SCALE_MAX_H = 560;
const GLASS_ZOOM = 1.4;

/** Staggered rise-and-fade for the panel's blocks when the screen opens. */
const useEntrance = (count: number) => {
  const values = useRef(
    Array.from({length: count}, () => new Animated.Value(0)),
  ).current;
  useEffect(() => {
    Animated.stagger(
      90,
      values.map(v =>
        Animated.timing(v, {
          toValue: 1,
          duration: 520,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ),
    ).start();
  }, [values]);
  return values.map(v => ({
    opacity: v,
    transform: [
      {translateY: v.interpolate({inputRange: [0, 1], outputRange: [24, 0]})},
    ],
  }));
};

interface ScaleConfig {
  icon: string;
  range: [number, number];
  tickStep: number;
  majorEvery: number;
  labels: number[];
}

export const SCALE: Record<WaterChannelKey, ScaleConfig> = {
  hot: {
    icon: FFilled.sun_cloud,
    range: HOT_RANGE,
    tickStep: 1,
    majorEvery: 10,
    labels: [90, 80, 75, 70, 60, 50, 40],
  },
  cold: {
    icon: FFilled.cloud_snow,
    range: COLD_RANGE,
    tickStep: 0.5,
    majorEvery: 5,
    labels: [15, 12, 10, 8, 4, 0],
  },
};

export const palettes = (
  c: ColorsProps,
): Record<WaterChannelKey, ScalePalette> => ({
  hot: {top: c.dangerNormal, mid: c.orange500, bottom: c.orange200},
  cold: {top: c.blue200, mid: c.blue500, bottom: c.blue800},
});

/** Full-height dark control: hot/cold tabs, power, draggable thermometer and readout. */
export const WaterModePanel: React.FC<Props> = props => {
  const {theme} = useTheme();
  const {colors} = theme;
  const {t} = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {active} = props;
  const [scaleH, setScaleH] = useState(0);
  const [barIn, scaleIn, readIn, glassIn, noteIn] = useEntrance(5);
  const onBodyLayout = (e: LayoutChangeEvent) =>
    setScaleH(Math.min(SCALE_MAX_H, Math.round(e.nativeEvent.layout.height)));

  const channels = {
    hot: {state: props.hot, setOn: props.setHotOn, setTemp: props.setHotTemp},
    cold: {
      state: props.cold,
      setOn: props.setColdOn,
      setTemp: props.setColdTemp,
    },
  };
  const cfg = SCALE[active];
  const {state, setOn, setTemp} = channels[active];
  const palette = palettes(colors)[active];
  const intensity = rangeFraction(state.temp, cfg.range);
  const water = mixHex(palette.bottom, palette.top, intensity);
  const [whole, half] = state.temp.toFixed(1).split('.');
  const title = t(`device.waterMode.${active}.title`);

  return (
    <View style={styles.panel}>
      <Animated.View style={[styles.bar, barIn]}>
        <View style={styles.tabs}>
          {(['hot', 'cold'] as const).map(k => {
            const ch = channels[k].state;
            const selected = k === active;
            const tint = palettes(colors)[k].mid;
            return (
              <Pressable
                key={k}
                onPress={() => props.onActiveChange(k)}
                style={[styles.tab, selected && styles.tabActive]}>
                <FIcon
                  icon={SCALE[k].icon}
                  size={18}
                  iconColor={ch.on ? tint : colors.subtitle}
                />
                <FText
                  typo="bodyLabel04"
                  color={selected ? colors.title : colors.body}>
                  {ch.on
                    ? `${String(ch.temp).replace('.', ',')}°`
                    : t('device.waterMode.off')}
                </FText>
              </Pressable>
            );
          })}
        </View>
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{checked: state.on}}
          accessibilityLabel={t('device.waterMode.togglePower', {
            channel: title.toLowerCase(),
          })}
          onPress={() => setOn(!state.on)}
          style={({pressed}) => [
            styles.power,
            {
              backgroundColor: state.on ? palette.mid : 'transparent',
              borderColor: state.on ? palette.mid : colors.border2,
              shadowColor: palette.mid,
              shadowOpacity: state.on ? 0.8 : 0,
            },
            pressed && styles.pressed,
          ]}>
          <FIcon
            icon={FOutlined.button_power}
            size={20}
            iconColor={state.on ? colors.onDarkPrimary : colors.subtitle}
          />
        </Pressable>
      </Animated.View>

      <View style={styles.body} onLayout={onBodyLayout}>
        <Animated.View style={scaleIn}>
          {scaleH > 0 && (
            <ThermoScale
              intro
              height={scaleH}
              value={state.temp}
              range={cfg.range}
              tickStep={cfg.tickStep}
              majorEvery={cfg.majorEvery}
              labels={cfg.labels}
              on={state.on}
              palette={palette}
              onChange={setTemp}
            />
          )}
        </Animated.View>

        <View style={styles.readout}>
          <Animated.View style={[styles.gap, readIn]}>
            <FText typo="body05" color={colors.subtitle}>
              {title.toUpperCase()}
            </FText>
            <FText typo="bodyLabel04" color={colors.body}>
              {cfg.range[0]} - {cfg.range[1]}°C
            </FText>

            {state.on ? (
              <View style={styles.gap}>
                <View style={styles.big}>
                  <FText typo="headline3" color={colors.title}>
                    {whole}
                  </FText>
                  <View>
                    <FText typo="bodyLabel01" color={palette.mid}>
                      °C
                    </FText>
                    {half !== '0' && (
                      <FText typo="bodyLabel02" color={colors.body}>
                        ,{half}
                      </FText>
                    )}
                  </View>
                </View>
                <FText typo="bodyLabel03" color={colors.body}>
                  {t(`device.waterMode.mood.${tempMood(active, state.temp)}`)}
                </FText>
              </View>
            ) : (
              <View style={styles.gap}>
                <FText typo="headline5" color={colors.subtitle}>
                  {t('device.waterMode.off')}
                </FText>
                <FText typo="bodyLabel04" color={colors.subtitle}>
                  {t('device.waterMode.offHint')}
                </FText>
              </View>
            )}
          </Animated.View>

          <Animated.View style={glassIn}>
            <View style={styles.glass}>
              <TempGlass
                channel={active}
                intensity={intensity}
                on={state.on}
                water={water}
              />
            </View>
          </Animated.View>

          <Animated.View style={noteIn}>
            {state.on && isExtremeTemp(active, state.temp) ? (
              <View style={styles.warn}>
                <FIcon
                  icon={FOutlined.warning_sign}
                  size={18}
                  iconColor={colors.warningNormal}
                />
                <FText typo="body05" color={colors.body} style={styles.flex}>
                  {t(`device.waterMode.${active}.warning`)}
                </FText>
              </View>
            ) : (
              <FText typo="body05" color={colors.subtitle}>
                {t('device.waterMode.dragHint')}
              </FText>
            )}
          </Animated.View>
        </View>
      </View>
    </View>
  );
};

export default WaterModePanel;

const createStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    panel: {
      flex: 1,
      gap: tokens.space.md,
    },
    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.spacing.xs,
    },
    tabs: {
      flex: 1,
      flexDirection: 'row',
      padding: tokens.spacing._3xs,
      borderRadius: tokens.borderRadius.full,
      backgroundColor: colors.grey1,
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: tokens.spacing._3xs,
      paddingVertical: tokens.spacing._2xs,
      borderRadius: tokens.borderRadius.full,
    },
    tabActive: {
      backgroundColor: colors.white,
    },
    power: {
      width: 44,
      height: 44,
      borderRadius: tokens.borderRadius.full,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      shadowOffset: {width: 0, height: 0},
      shadowRadius: 12,
    },
    pressed: {
      transform: [{scale: 0.94}],
    },
    body: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    readout: {
      flex: 1,
      alignSelf: 'stretch',
      justifyContent: 'space-around',
    },
    gap: {
      gap: tokens.spacing._3xs,
    },
    glass: {
      alignSelf: 'flex-start',
      transform: [{scale: GLASS_ZOOM}],
      transformOrigin: 'left',
    },
    big: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: tokens.spacing._3xs,
    },
    warn: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: tokens.spacing._2xs,
    },
    flex: {
      flex: 1,
    },
  });
