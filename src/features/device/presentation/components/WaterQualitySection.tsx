import React, {useEffect, useMemo, useRef} from 'react';
import {Animated, Easing, StyleSheet, View} from 'react-native';
import Svg, {Circle, Path} from 'react-native-svg';
import {useTranslation} from 'react-i18next';
import {ColorsProps, useTheme} from '@/core/theme';
import {FText} from '@/shared/components';
import {tokens} from '@/shared/styles';
import {DeviceSection} from './DeviceSection';
import {filterEfficiency, particleCount} from '../purifierUtils';

interface Props {
  tdsIn: number;
  tdsOut: number;
}

// ponytail: fixed demo thresholds; move to device config if models differ.
const outVerdict = (tds: number) =>
  tds <= 50 ? 'pure' : tds <= 150 ? 'ok' : 'check';

const DROP_W = 84;
const DROP_H = 104;
const DROP = 'M42 4 C42 4 8 46 8 68 A34 34 0 0 0 76 68 C76 46 42 4 42 4 Z';
const RING = 64;
const RING_R = 27;

/** Golden-angle spiral: evenly spread dots inside the round part of the drop. */
const particles = (count: number) =>
  Array.from({length: count}, (_, i) => {
    const r = 26 * Math.sqrt((i + 0.5) / Math.max(count, 1));
    const a = i * 2.39996;
    return {x: 42 + r * Math.cos(a), y: 68 + r * Math.sin(a)};
  });

const Drop: React.FC<{
  count: number;
  fill: string;
  stroke: string;
  dot: string;
  highlight: string;
  phase: Animated.Value;
}> = ({count, fill, stroke, dot, highlight, phase}) => (
  <View style={styles.drop}>
    <Svg width={DROP_W} height={DROP_H} style={StyleSheet.absoluteFill}>
      <Path d={DROP} fill={fill} stroke={stroke} strokeWidth={2} />
      <Path
        d="M26 58 Q24 70 30 80"
        stroke={highlight}
        strokeOpacity={0.7}
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        {
          transform: [
            {
              translateY: phase.interpolate({
                inputRange: [0, 1],
                outputRange: [-2.5, 2.5],
              }),
            },
          ],
        },
      ]}>
      <Svg width={DROP_W} height={DROP_H}>
        {particles(count).map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={i % 3 ? 1.8 : 2.6} fill={dot} />
        ))}
      </Svg>
    </Animated.View>
  </View>
);

export const WaterQualitySection: React.FC<Props> = ({tdsIn, tdsOut}) => {
  const {theme, isDark} = useTheme();
  const {colors} = theme;
  const {t} = useTranslation();
  const s = useMemo(() => createStyles(colors), [colors]);
  const efficiency = filterEfficiency(tdsIn, tdsOut);
  const phase = useRef(new Animated.Value(0)).current;
  const flow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const sway = Animated.loop(
      Animated.sequence([
        Animated.timing(phase, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(phase, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    const stream = Animated.loop(
      Animated.timing(flow, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    sway.start();
    stream.start();
    return () => {
      sway.stop();
      stream.stop();
    };
  }, [phase, flow]);

  const circumference = 2 * Math.PI * RING_R;

  return (
    <DeviceSection title={t('device.quality.title')}>
      <View style={s.flowRow}>
        <View style={s.end}>
          <Drop
            count={particleCount(tdsIn)}
            fill={colors.grey1}
            stroke={colors.grey2}
            dot={colors.grey600}
            highlight={colors.onDarkPrimary}
            phase={phase}
          />
          <FText typo="body05" color={colors.subtitle}>
            {t('device.quality.in')}
          </FText>
          <View style={s.value}>
            <FText typo="headline8" color={colors.title}>
              {tdsIn}
            </FText>
            <FText typo="body05" color={colors.subtitle}>
              ppm
            </FText>
          </View>
        </View>

        <View style={s.middle}>
          <View style={s.pipe}>
            {[0, 1, 2, 3, 4, 5, 6].map(i => (
              <Animated.View
                key={i}
                style={[
                  s.dash,
                  {
                    transform: [
                      {
                        translateX: flow.interpolate({
                          inputRange: [0, 1],
                          outputRange: [i * 28 - 28, i * 28],
                        }),
                      },
                    ],
                  },
                ]}
              />
            ))}
          </View>
          <View style={s.ring}>
            <Svg width={RING} height={RING} style={StyleSheet.absoluteFill}>
              <Circle
                cx={RING / 2}
                cy={RING / 2}
                r={RING_R}
                stroke={colors.grey1}
                strokeWidth={6}
                fill={colors.white}
              />
              <Circle
                cx={RING / 2}
                cy={RING / 2}
                r={RING_R}
                stroke={colors.primary}
                strokeWidth={6}
                strokeLinecap="round"
                fill="none"
                strokeDasharray={`${
                  (circumference * efficiency) / 100
                } ${circumference}`}
                rotation={-90}
                origin={`${RING / 2}, ${RING / 2}`}
              />
            </Svg>
            <FText typo="bodyLabel03" color={colors.title}>
              {efficiency}%
            </FText>
          </View>
          <FText typo="body05" color={colors.subtitle}>
            {t('device.quality.efficiency')}
          </FText>
        </View>

        <View style={s.end}>
          <Drop
            count={particleCount(tdsOut)}
            fill={isDark ? colors.blue900 : colors.blue50}
            stroke={colors.blue300}
            dot={colors.blue600}
            highlight={colors.onDarkPrimary}
            phase={phase}
          />
          <FText typo="body05" color={colors.subtitle}>
            {t('device.quality.out')}
          </FText>
          <View style={s.value}>
            <FText typo="headline8" color={colors.primary}>
              {tdsOut}
            </FText>
            <FText typo="body05" color={colors.subtitle}>
              ppm
            </FText>
          </View>
        </View>
      </View>

      <View style={s.verdict}>
        <View style={s.badge}>
          <FText typo="bodyLabel04" color={colors.onDarkPrimary}>
            {t(`device.quality.verdict.${outVerdict(tdsOut)}`)}
          </FText>
        </View>
        <FText typo="body04" color={colors.subtitle} style={s.flex}>
          {t('device.quality.note', {removed: tdsIn - tdsOut})}
        </FText>
      </View>
    </DeviceSection>
  );
};

export default WaterQualitySection;

const styles = StyleSheet.create({
  drop: {
    width: DROP_W,
    height: DROP_H,
  },
});

const createStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    flowRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    end: {
      alignItems: 'center',
      gap: tokens.spacing._3xs,
    },
    value: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: tokens.spacing._3xs,
    },
    middle: {
      flex: 1,
      alignItems: 'center',
      gap: tokens.spacing._3xs,
      marginBottom: tokens.space.lg,
    },
    pipe: {
      position: 'absolute',
      top: RING / 2 - 2,
      left: 0,
      right: 0,
      height: 4,
      borderRadius: tokens.borderRadius.full,
      backgroundColor: colors.grey1,
      overflow: 'hidden',
    },
    dash: {
      position: 'absolute',
      left: 0,
      width: 10,
      height: 4,
      borderRadius: tokens.borderRadius.full,
      backgroundColor: colors.blue400,
    },
    ring: {
      width: RING,
      height: RING,
      alignItems: 'center',
      justifyContent: 'center',
    },
    verdict: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.spacing._2xs,
    },
    badge: {
      paddingHorizontal: tokens.spacing._2xs,
      paddingVertical: tokens.spacing._3xs,
      borderRadius: tokens.borderRadius.full,
      backgroundColor: colors.primary,
    },
    flex: {
      flex: 1,
    },
  });
