import React, {useEffect, useMemo, useState} from 'react';
import {
  Dimensions,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import Svg, {Defs, LinearGradient, Path, Stop} from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import {useTheme} from '@/core/theme';
import {colors} from '@/core/theme/colors';

const LOOP_DURATION = 7000;

const BACK_WAVELENGTH = 420;
const FRONT_WAVELENGTH = 380;

export type WaveStatus = 'normal' | 'warning' | 'error';

type WavePalette = {
  back: string;
  backEnd: string;
  front: string;
};

// normal = #38C4FF, warning = #F16623, error = #ED1C24 (front anchors);
// back/end are derived tints so the gradient keeps its depth — end stays
// tinted (not white) so the wave visibly covers the whole container
const STATUS_PALETTE: Record<WaveStatus, WavePalette> = {
  normal: {back: '#C1EDFF', backEnd: '#D9F2FF', front: '#38C4FF'},
  warning: {back: '#FDDAC8', backEnd: '#FEE9DE', front: '#F16623'},
  error: {back: '#FBC5C7', backEnd: '#FDE0E1', front: '#ED1C24'},
};

const STATUS_PALETTE_DARK: Record<WaveStatus, WavePalette> = {
  normal: {
    back: colors.blue[700],
    backEnd: colors.blue[900],
    front: colors.blue[500],
  },
  warning: {back: '#B84A16', backEnd: '#702E0D', front: '#F16623'},
  error: {back: '#B2141B', backEnd: '#6A0C10', front: '#ED1C24'},
};

/** Container base color for a status — blends with the wave's top gradient. */
export const waveBackgroundColor = (status: WaveStatus, isDark: boolean) =>
  (isDark ? STATUS_PALETTE_DARK : STATUS_PALETTE)[status].back;

const {width: SCREEN_W, height: SCREEN_H} = Dimensions.get('window');

const BACK_BASE_Y = 30;
const FRONT_BASE_Y = 22;
const BACK_AMPLITUDE = 16;
const FRONT_AMPLITUDE = 14;

// exactly-periodic wave path: quadratic crest + reflected trough per
// wavelength, so translating by one wavelength loops seamlessly. The path is
// static — motion comes from a GPU-composited translateX on the wrapper, with
// zero per-frame prop updates (the old per-frame `d` rebuild janked).
const buildWavePath = (
  baseY: number,
  amplitude: number,
  wavelength: number,
  width: number,
  fillHeight: number,
) => {
  const half = wavelength / 2;
  const periods = Math.ceil(width / wavelength);
  const endX = periods * wavelength;
  let d = `M 0 ${baseY}`;
  for (let i = 0; i < periods; i++) {
    d += ` q ${half / 2} ${-2 * amplitude} ${half} 0 t ${half} 0`;
  }
  d += ` L ${endX} ${fillHeight} L 0 ${fillHeight} Z`;
  return d;
};

const WaveGradient: React.FC<{
  id: string;
  color: string;
  endColor: string;
  endOpacity: number;
  fillHeight: number;
}> = ({id, color, endColor, endOpacity, fillHeight}) => (
  <LinearGradient
    id={id}
    gradientUnits="userSpaceOnUse"
    x1={0}
    y1={0}
    x2={0}
    y2={fillHeight}>
    <Stop offset="0" stopColor={color} stopOpacity="1" />
    <Stop offset="1" stopColor={endColor} stopOpacity={endOpacity} />
  </LinearGradient>
);

type WaterWaveProps = {
  /** First-paint fallback only; the measured layout always wins. */
  height?: number;
  isDark?: boolean;
  status?: WaveStatus;
  /** Water surface as a fraction of container height, 0 (top) to 1 (bottom).
      Omit to keep the reference geometry untouched. */
  waterLevel?: number;
};

export const WaterWaveBackground = React.memo(function WaterWave({
  height = SCREEN_H,
  isDark: propIsDark,
  status = 'normal',
  waterLevel,
}: WaterWaveProps) {
  const themeContext = useTheme();
  const isDark = propIsDark ?? themeContext?.isDark ?? false;

  const palette = (isDark ? STATUS_PALETTE_DARK : STATUS_PALETTE)[status];

  // falls back to screen size for the first paint, then trusts onLayout so the
  // wave fills any container (full screen or a card) without distortion
  const [layout, setLayout] = useState({w: SCREEN_W, h: height});

  const handleLayout = (event: LayoutChangeEvent) => {
    const {width, height: measuredHeight} = event.nativeEvent.layout;
    setLayout(prev =>
      prev.w === width && prev.h === measuredHeight
        ? prev
        : {w: width, h: measuredHeight},
    );
  };

  // without waterLevel the reference geometry applies as-is; with it, the
  // surface is anchored at the given fraction of the height
  const back = useMemo(
    () => ({
      baseY:
        waterLevel != null ? layout.h * (waterLevel + 0.03) : BACK_BASE_Y,
      fillHeight: layout.h,
      width: layout.w + BACK_WAVELENGTH,
      d: buildWavePath(
        waterLevel != null ? layout.h * (waterLevel + 0.03) : BACK_BASE_Y,
        BACK_AMPLITUDE,
        BACK_WAVELENGTH,
        layout.w + BACK_WAVELENGTH,
        layout.h,
      ),
    }),
    [layout, waterLevel],
  );

  const front = useMemo(
    () => ({
      baseY: waterLevel != null ? layout.h * waterLevel : FRONT_BASE_Y,
      fillHeight:
        waterLevel != null ? layout.h : Math.round(layout.h * 0.45),
      width: layout.w + FRONT_WAVELENGTH,
      d: buildWavePath(
        waterLevel != null ? layout.h * waterLevel : FRONT_BASE_Y,
        FRONT_AMPLITUDE,
        FRONT_WAVELENGTH,
        layout.w + FRONT_WAVELENGTH,
        waterLevel != null ? layout.h : Math.round(layout.h * 0.45),
      ),
    }),
    [layout, waterLevel],
  );

  const backX = useSharedValue(0);
  const frontX = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      return;
    }
    // travel exactly one wavelength per loop — the pattern is periodic, so the
    // repeat point is invisible; front runs 2× the speed like the reference
    backX.value = withRepeat(
      withTiming(-BACK_WAVELENGTH, {
        duration: LOOP_DURATION,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
    frontX.value = withRepeat(
      withTiming(-FRONT_WAVELENGTH, {
        duration: LOOP_DURATION / 2,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  }, [backX, frontX, reduceMotion]);

  const backStyle = useAnimatedStyle(() => ({
    transform: [{translateX: backX.value}],
  }));
  const frontStyle = useAnimatedStyle(() => ({
    transform: [{translateX: frontX.value}],
  }));

  return (
    <View
      style={[StyleSheet.absoluteFill, styles.clip]}
      pointerEvents="none"
      onLayout={handleLayout}>
      <Animated.View style={[styles.layer, {width: back.width}, backStyle]}>
        <Svg width={back.width} height={layout.h}>
          <Defs>
            <WaveGradient
              id="waveGradBack"
              color={palette.back}
              endColor={palette.backEnd}
              endOpacity={1}
              fillHeight={back.fillHeight}
            />
          </Defs>
          <Path d={back.d} fill="url(#waveGradBack)" />
        </Svg>
      </Animated.View>
      <Animated.View style={[styles.layer, {width: front.width}, frontStyle]}>
        <Svg width={front.width} height={layout.h}>
          <Defs>
            <WaveGradient
              id="waveGradFront"
              color={palette.front}
              endColor={palette.front}
              endOpacity={0}
              fillHeight={front.fillHeight}
            />
          </Defs>
          <Path d={front.d} fill="url(#waveGradFront)" />
        </Svg>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
  },
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
  },
});
