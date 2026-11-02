import React, {useEffect, useRef, useState} from 'react';
import {Animated, Easing, Pressable, StyleSheet, View} from 'react-native';
import {GestureDetector, usePanGesture} from 'react-native-gesture-handler';
import Svg, {Defs, Line, LinearGradient, Path, Stop} from 'react-native-svg';
import {useTheme} from '@/core/theme';
import {FIcon, FText} from '@/shared/components';
import {FOutlined, tokens} from '@/shared/styles';
import {rangeFraction} from '../purifierUtils';

export interface ScalePalette {
  top: string;
  mid: string;
  bottom: string;
}

interface Props {
  value: number;
  range: [number, number];
  /** Distance between two minor ticks. */
  tickStep: number;
  /** Every n-th degree gets a long tick. */
  majorEvery: number;
  /** Tappable shortcuts along the scale. */
  labels: number[];
  on: boolean;
  palette: ScalePalette;
  onChange: (temp: number) => void;
  height?: number;
  /** Sweep the thumb up from the bottom on mount. */
  intro?: boolean;
}

const PAD = 22; // thumb radius + breathing room at both ends
const LABEL_W = 52;
const TRACK_W = 88;
const LINE_X = 74; // x of the resting line inside the track
const BULGE = 38; // how far the line bows out around the thumb
const SIGMA = 26; // vertical spread of the bow
const THUMB = 30;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Vertical thermometer: labels on the left, a gradient line that bows around a
 * draggable thumb. Drag anywhere on the track or tap a label to set the value.
 */
export const ThermoScale: React.FC<Props> = ({
  value,
  range,
  tickStep,
  majorEvery,
  labels,
  on,
  palette,
  onChange,
  height: HEIGHT = 320,
  intro = false,
}) => {
  const {theme, isDark} = useTheme();
  const {colors} = theme;
  const [min, max] = range;
  const frac = rangeFraction(value, range);
  const yOf = (f: number) => PAD + (1 - f) * (HEIGHT - 2 * PAD);

  // The drawn position eases towards `frac`; while dragging it follows the finger 1:1.
  const anim = useRef(new Animated.Value(intro ? 0 : frac)).current;
  const [shown, setShown] = useState(intro ? 0 : frac);
  const dragging = useRef(false);
  const first = useRef(intro);
  const latest = useRef({frac, min, max, on, onChange, HEIGHT});
  latest.current = {frac, min, max, on, onChange, HEIGHT};

  useEffect(() => {
    const id = anim.addListener(({value: v}) => setShown(v));
    return () => anim.removeListener(id);
  }, [anim]);

  useEffect(() => {
    if (!dragging.current) {
      const sweep = first.current;
      first.current = false;
      Animated.timing(anim, {
        toValue: frac,
        duration: sweep ? 1100 : 420,
        delay: sweep ? 250 : 0,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }
  }, [anim, frac]);

  const follow = (y: number) => {
    const l = latest.current;
    const f = clamp01(1 - (y - PAD) / (l.HEIGHT - 2 * PAD));
    anim.setValue(f);
    l.onChange(l.min + f * (l.max - l.min));
  };
  const pan = usePanGesture({
    enabled: on,
    minDistance: 0,
    runOnJS: true,
    onBegin: e => {
      dragging.current = true;
      anim.stopAnimation();
      follow(e.y);
    },
    onUpdate: e => follow(e.y),
    onFinalize: () => {
      dragging.current = false;
      // Settle on the snapped value the parent stored.
      Animated.spring(anim, {
        toValue: latest.current.frac,
        useNativeDriver: false,
        speed: 20,
        bounciness: 6,
      }).start();
    },
  });

  const thumbY = yOf(shown);
  const bow = on ? BULGE : BULGE * 0.55;
  const curveX = (y: number) =>
    LINE_X - bow * Math.exp(-(((y - thumbY) / SIGMA) ** 2));

  let d = '';
  for (let y = 0; y <= HEIGHT; y += 4) {
    d += `${y ? 'L' : 'M'}${curveX(y).toFixed(1)} ${y}`;
  }

  const ticks: {y: number; len: number; lit: boolean}[] = [];
  for (let t = min; t <= max + 1e-6; t += tickStep) {
    const f = rangeFraction(t, range);
    const len = t % majorEvery === 0 ? 24 : t % 1 === 0 ? 14 : 8;
    ticks.push({y: yOf(f), len, lit: on && t <= value + 1e-6});
  }

  const lineColor = on ? undefined : colors.border2;
  const glowColor = isDark ? colors.onDarkPrimary : palette.top;
  const glowTop = ((thumbY - 80) / HEIGHT).toFixed(3);
  const glowBottom = ((thumbY + 80) / HEIGHT).toFixed(3);
  const glowMid = (thumbY / HEIGHT).toFixed(3);

  return (
    <View style={[styles.row, {height: HEIGHT}]}>
      <View style={styles.labels}>
        {labels.map(t => {
          const active = on && Math.abs(value - t) < 0.25;
          return (
            <Pressable
              key={t}
              disabled={!on}
              hitSlop={6}
              onPress={() => onChange(t)}
              style={[styles.label, {top: yOf(rangeFraction(t, range)) - 10}]}>
              <View
                style={[styles.dot, active && {backgroundColor: palette.mid}]}
              />
              <FText
                typo={active ? 'bodyLabel02' : 'bodyLabel04'}
                color={
                  active ? palette.mid : on ? colors.title : colors.subtitle
                }>
                {t}°
              </FText>
            </Pressable>
          );
        })}
      </View>

      <GestureDetector gesture={pan}>
        {/* Unflattened, or the pan binds to a full-width ancestor. */}
        <View collapsable={false} style={[styles.track, {height: HEIGHT}]}>
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <Svg width={TRACK_W} height={HEIGHT}>
              <Defs>
                <LinearGradient
                  id="line"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2={HEIGHT}
                  gradientUnits="userSpaceOnUse">
                  <Stop offset="0" stopColor={palette.top} stopOpacity={0} />
                  <Stop offset="0.14" stopColor={palette.top} />
                  <Stop offset="0.5" stopColor={palette.mid} />
                  <Stop offset="0.86" stopColor={palette.bottom} />
                  <Stop offset="1" stopColor={palette.bottom} stopOpacity={0} />
                </LinearGradient>
                <LinearGradient
                  id="glow"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2={HEIGHT}
                  gradientUnits="userSpaceOnUse">
                  <Stop
                    offset={glowTop}
                    stopColor={glowColor}
                    stopOpacity={0}
                  />
                  <Stop
                    offset={glowMid}
                    stopColor={glowColor}
                    stopOpacity={0.9}
                  />
                  <Stop
                    offset={glowBottom}
                    stopColor={glowColor}
                    stopOpacity={0}
                  />
                </LinearGradient>
              </Defs>
              {ticks.map(tk => {
                const x2 = curveX(tk.y) - 8;
                return (
                  <Line
                    key={tk.y}
                    x1={x2 - tk.len}
                    x2={x2}
                    y1={tk.y}
                    y2={tk.y}
                    stroke={tk.lit ? colors.body : colors.border2}
                    strokeWidth={1}
                  />
                );
              })}
              <Path
                d={d}
                stroke={lineColor ?? 'url(#line)'}
                strokeWidth={3}
                strokeLinecap="round"
                fill="none"
              />
              {on && (
                <Path d={d} stroke="url(#glow)" strokeWidth={3} fill="none" />
              )}
            </Svg>
            <View
              style={[
                styles.thumb,
                {
                  left: LINE_X - BULGE + 4,
                  top: thumbY - THUMB / 2,
                  borderColor: colors.white,
                  backgroundColor: on ? palette.mid : colors.border2,
                },
              ]}>
              <FIcon
                icon={FOutlined.enlarge_vertical}
                size={14}
                iconColor={colors.onDarkPrimary}
              />
            </View>
          </View>
        </View>
      </GestureDetector>
    </View>
  );
};

export default ThermoScale;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  labels: {
    width: LABEL_W,
  },
  label: {
    position: 'absolute',
    left: 0,
    height: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing._3xs,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: tokens.borderRadius.full,
  },
  track: {
    width: TRACK_W,
  },
  thumb: {
    position: 'absolute',
    width: THUMB,
    height: THUMB,
    borderRadius: tokens.borderRadius.full,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
