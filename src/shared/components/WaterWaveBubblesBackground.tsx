import React, {useEffect, useMemo} from 'react';
import {Dimensions, StyleSheet} from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {useTheme} from '@/core/theme';
import {colors} from '@/core/theme/colors';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const LOOP_DURATION = 7000;
const SEGMENTS = 8;

type WaveConfig = {
  baseY: number;
  amplitude: number;
  wavelength: number;
  fillHeight: number;
  speed: number;
  phaseOffset: number;
  gradientId: string;
  color: string;
  endColor?: string;
  endOpacity?: number;
};

type WaveShape = Omit<WaveConfig, 'fillHeight'>;

type BubbleConfig = {
  xFrac: number;
  r: number;
  duration: number;
  offset: number;
  wobble: number;
  wobbleFreq: number;
};

const {width: SCREEN_W, height: SCREEN_H} = Dimensions.get('window');

// wave level left by the previously mounted screen — survives unmount/remount
// across navigation, so the water flows from the old height to the new one
let lastWaveHeight: number | null = null;

const BACK_LIGHT: WaveShape = {
  baseY: 30,
  amplitude: 16,
  wavelength: 420,
  speed: 1,
  phaseOffset: 0,
  gradientId: 'waveGradBack',
  color: '#C1EDFF',
  endColor: '#FFFFFF',
  endOpacity: 1,
};

const FRONT_LIGHT: WaveShape = {
  baseY: 22,
  amplitude: 14,
  wavelength: 380,
  speed: 2,
  phaseOffset: Math.PI / 3,
  gradientId: 'waveGradFront',
  color: '#92DBFA',
};

// bubbles stop just under the front wave crest
const SURFACE_Y = FRONT_LIGHT.baseY + FRONT_LIGHT.amplitude;

const BUBBLES: BubbleConfig[] = [
  {xFrac: 0.12, r: 7, duration: 8000, offset: 0, wobble: 8, wobbleFreq: 1.5},
  {xFrac: 0.3, r: 13, duration: 6500, offset: 0.35, wobble: 12, wobbleFreq: 1},
  {xFrac: 0.5, r: 17, duration: 9000, offset: 0.7, wobble: 14, wobbleFreq: 2},
  {xFrac: 0.68, r: 9, duration: 7000, offset: 0.15, wobble: 10, wobbleFreq: 1.5},
  {xFrac: 0.88, r: 11, duration: 10000, offset: 0.5, wobble: 11, wobbleFreq: 1},
];

const buildWavePath = (config: WaveConfig, phase: number, width: number) => {
  'worklet';
  const step = width / SEGMENTS;
  const yAt = (x: number) =>
    config.baseY +
    config.amplitude *
      Math.sin(
        (2 * Math.PI * x) / config.wavelength +
          phase * config.speed +
          config.phaseOffset,
      );
  let d = `M 0 ${yAt(0)}`;
  for (let i = 1; i <= SEGMENTS; i++) {
    const x0 = (i - 1) * step;
    const x1 = i * step;
    d += ` C ${x0 + step / 2} ${yAt(x0)} ${x1 - step / 2} ${yAt(
      x1,
    )} ${x1} ${yAt(x1)}`;
  }
  d += ` L ${width} ${config.fillHeight} L 0 ${config.fillHeight} Z`;
  return d;
};

// vertical gradient in objectBoundingBox space — follows the path bbox, so it
// stretches for free as the animated fillHeight changes
const WaveGradient: React.FC<{
  config: Pick<WaveConfig, 'gradientId' | 'color' | 'endColor' | 'endOpacity'>;
}> = ({config}) => (
  <LinearGradient id={config.gradientId} x1={0} y1={0} x2={0} y2={1}>
    <Stop offset="0" stopColor={config.color} stopOpacity="1" />
    <Stop
      offset="1"
      stopColor={config.endColor ?? config.color}
      stopOpacity={config.endOpacity ?? 0}
    />
  </LinearGradient>
);

const BubbleGradient = () => (
  <RadialGradient id="bubbleGrad" cx="0.5" cy="0.4" r="0.6">
    <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.65" />
    <Stop offset="0.55" stopColor="#E4F1FD" stopOpacity="0.4" />
    <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0.9" />
  </RadialGradient>
);

const bubbleProps = (bubble: BubbleConfig, elapsed: number, height: number) => {
  'worklet';
  const p = (elapsed / bubble.duration + bubble.offset) % 1;
  const startCy = height + bubble.r;
  const endCy = SURFACE_Y + bubble.r;
  return {
    cx:
      bubble.xFrac * SCREEN_W +
      bubble.wobble * Math.sin(2 * Math.PI * bubble.wobbleFreq * p),
    cy: startCy - (startCy - endCy) * p,
    // fade in over the first 10% of the rise, fade out over the last 25%
    opacity: Math.min(1, Math.min(p / 0.1, (1 - p) / 0.25)),
  };
};

type WaterWaveBubblesProps = {
  height?: number;
  isDark?: boolean;
};

export const WaterWaveBubblesBackground = React.memo(
  function WaterWaveBubbles({
    height = SCREEN_H,
    isDark: propIsDark,
  }: WaterWaveBubblesProps) {
    const themeContext = useTheme();
    const isDark = propIsDark ?? themeContext?.isDark ?? false;

    const backShape = useMemo<WaveShape>(
      () => ({
        ...BACK_LIGHT,
        color: isDark ? colors.blue[700] : BACK_LIGHT.color,
        endColor: isDark ? colors.blue[900] : BACK_LIGHT.endColor,
        endOpacity: 1,
      }),
      [isDark],
    );

    const frontShape = useMemo<WaveShape>(
      () => ({
        ...FRONT_LIGHT,
        color: isDark ? colors.blue[500] : FRONT_LIGHT.color,
        endColor: isDark ? colors.blue[500] : FRONT_LIGHT.color,
        endOpacity: 0,
      }),
      [isDark],
    );

    const elapsed = useSharedValue(0);
    const reduceMotion = useReducedMotion();
    // tweened height — starts at the previous screen's level so navigation
    // makes the water rise/recede instead of snapping
    const animHeight = useSharedValue(lastWaveHeight ?? height);
    const initialHeight = lastWaveHeight ?? height;

    useEffect(() => {
      animHeight.value = reduceMotion
        ? height
        : withTiming(height, {duration: 8000, easing: Easing.out(Easing.cubic)});
      lastWaveHeight = height;
    }, [animHeight, height, reduceMotion]);

    useFrameCallback(
      info => {
        // accumulate frame deltas — the shared value survives re-renders and
        // callback re-registrations, so waves and bubbles never restart mid-scroll
        elapsed.value += info.timeSincePreviousFrame ?? 0;
      },
      !reduceMotion,
    );

    const backProps = useAnimatedProps(() => ({
      d: buildWavePath(
        {...BACK_LIGHT, fillHeight: animHeight.value},
        (elapsed.value / LOOP_DURATION) * 2 * Math.PI,
        SCREEN_W,
      ),
    }));
    const frontProps = useAnimatedProps(() => ({
      d: buildWavePath(
        {...FRONT_LIGHT, fillHeight: animHeight.value * 0.45},
        (elapsed.value / LOOP_DURATION) * 2 * Math.PI,
        SCREEN_W,
      ),
    }));
    const bubbleAnims = [
      useAnimatedProps(() =>
        bubbleProps(BUBBLES[0], elapsed.value, animHeight.value),
      ),
      useAnimatedProps(() =>
        bubbleProps(BUBBLES[1], elapsed.value, animHeight.value),
      ),
      useAnimatedProps(() =>
        bubbleProps(BUBBLES[2], elapsed.value, animHeight.value),
      ),
      useAnimatedProps(() =>
        bubbleProps(BUBBLES[3], elapsed.value, animHeight.value),
      ),
      useAnimatedProps(() =>
        bubbleProps(BUBBLES[4], elapsed.value, animHeight.value),
      ),
    ];

    return (
      <Svg
        style={StyleSheet.absoluteFill}
        viewBox={`0 0 ${SCREEN_W} ${height}`}
        pointerEvents="none">
        <Defs>
          <WaveGradient config={backShape} />
          <WaveGradient config={frontShape} />
          <BubbleGradient />
        </Defs>
        <AnimatedPath
          animatedProps={backProps}
          d={buildWavePath(
            {...BACK_LIGHT, fillHeight: initialHeight},
            0,
            SCREEN_W,
          )}
          fill={`url(#${backShape.gradientId})`}
        />
        <AnimatedPath
          animatedProps={frontProps}
          d={buildWavePath(
            {...FRONT_LIGHT, fillHeight: initialHeight * 0.45},
            0,
            SCREEN_W,
          )}
          fill={`url(#${frontShape.gradientId})`}
        />
        {BUBBLES.map((bubble, i) => (
          <AnimatedCircle
            key={bubble.xFrac}
            animatedProps={bubbleAnims[i]}
            cx={bubble.xFrac * SCREEN_W}
            cy={initialHeight + bubble.r}
            r={bubble.r}
            fill="url(#bubbleGrad)"
          />
        ))}
      </Svg>
    );
  },
);
