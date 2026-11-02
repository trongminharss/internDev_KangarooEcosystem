import React, {useEffect, useRef} from 'react';
import {Animated, Easing, StyleSheet, View} from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import {useTheme} from '@/core/theme';

const EASE = Easing.bezier(0.32, 0.72, 0, 1);
const WIDTH = 176;
const HEIGHT = 224;

// Product render materials (brushed white shell, graphite glass, chrome) stay fixed
// in both themes — it is a picture of a physical object, not UI chrome.
const SHELL = ['#FFFFFF', '#EEF1F5', '#D9DEE6'];
const SIDE = ['#CBD2DC', '#A9B2C0'];
const GLASS = ['#2A3140', '#11151C'];
const CHROME = ['#F4F6F9', '#9AA3B0'];

/**
 * Pseudo-3D countertop water purifier: layered gradients for the faces plus a slow
 * sway and float, with a ground shadow that follows and breathes in sync.
 */
export const WaterPurifier3D: React.FC<{size?: number}> = ({size = 1}) => {
  const {theme} = useTheme();
  const {colors} = theme;
  const sway = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const swing = (to: number) =>
      Animated.timing(sway, {
        toValue: to,
        duration: 2600,
        easing: EASE,
        useNativeDriver: true,
      });
    const bob = (to: number) =>
      Animated.timing(float, {
        toValue: to,
        duration: 1800,
        easing: EASE,
        useNativeDriver: true,
      });
    const loop = Animated.parallel([
      Animated.loop(Animated.sequence([swing(1), swing(-1)])),
      Animated.loop(Animated.sequence([bob(1), bob(0)])),
    ]);
    loop.start();
    return () => loop.stop();
  }, [sway, float]);

  // faked yaw: a real rotateY + perspective makes iOS mis-composite the modal sheet
  // (half of it stops drawing), so turn with 2D affine only — narrow + shear.
  const scaleX = sway.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [0.93, 1, 0.93],
  });
  const skewY = sway.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-4deg', '4deg'],
  });
  const shadowShift = sway.interpolate({
    inputRange: [-1, 1],
    outputRange: [-6, 6],
  });
  const translateY = float.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });
  const shadowScale = float.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.86],
  });

  const w = WIDTH * size;
  const h = HEIGHT * size;

  return (
    <View style={{width: w, height: h}}>
      <Animated.View
        style={[
          styles.shadow,
          {
            left: w * 0.1,
            transform: [{translateX: shadowShift}, {scaleX: shadowScale}],
          },
        ]}>
        <Svg width={w * 0.8} height={24 * size} viewBox="0 0 100 24">
          <Defs>
            <RadialGradient id="floor" cx="0.5" cy="0.5" r="0.5">
              <Stop offset="0" stopColor={colors.black} stopOpacity="0.22" />
              <Stop offset="1" stopColor={colors.black} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Ellipse cx="50" cy="12" rx="50" ry="12" fill="url(#floor)" />
        </Svg>
      </Animated.View>
      <Animated.View style={{transform: [{translateY}, {skewY}, {scaleX}]}}>
        <Svg width={w} height={h} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
          <Defs>
            <LinearGradient id="shell" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={SHELL[0]} />
              <Stop offset="0.55" stopColor={SHELL[1]} />
              <Stop offset="1" stopColor={SHELL[2]} />
            </LinearGradient>
            <LinearGradient id="side" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={SIDE[0]} />
              <Stop offset="1" stopColor={SIDE[1]} />
            </LinearGradient>
            <LinearGradient id="top" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#FFFFFF" />
              <Stop offset="1" stopColor="#E4E8EE" />
            </LinearGradient>
            <LinearGradient id="glass" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={GLASS[0]} />
              <Stop offset="1" stopColor={GLASS[1]} />
            </LinearGradient>
            <LinearGradient id="chrome" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={CHROME[0]} />
              <Stop offset="1" stopColor={CHROME[1]} />
            </LinearGradient>
            <LinearGradient id="water" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.info} stopOpacity="0.35" />
              <Stop offset="1" stopColor={colors.info} stopOpacity="0.85" />
            </LinearGradient>
            <LinearGradient id="sheen" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
              <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.7" />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
            </LinearGradient>
            <RadialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
              <Stop offset="0" stopColor={colors.info} stopOpacity="0.9" />
              <Stop offset="1" stopColor={colors.info} stopOpacity="0" />
            </RadialGradient>
          </Defs>

          {/* right side face gives the body its depth */}
          <Path d="M132 44 L152 32 L152 196 L132 212 Z" fill="url(#side)" />
          {/* top face */}
          <Path d="M36 44 L56 32 L152 32 L132 44 Z" fill="url(#top)" />
          {/* front face */}
          <Rect
            x="24"
            y="44"
            width="108"
            height="168"
            rx="18"
            fill="url(#shell)"
          />
          <Rect
            x="30"
            y="50"
            width="6"
            height="150"
            rx="3"
            fill="url(#sheen)"
            opacity="0.8"
          />

          {/* faucet: column on the top face, spout reaching forward */}
          <G>
            <Rect
              x="98"
              y="10"
              width="12"
              height="30"
              rx="6"
              fill="url(#chrome)"
            />
            <Path
              d="M104 14 C104 2 84 2 82 14 L82 22"
              stroke="url(#chrome)"
              strokeWidth="8"
              strokeLinecap="round"
              fill="none"
            />
          </G>

          {/* graphite control panel */}
          <Rect
            x="40"
            y="62"
            width="76"
            height="70"
            rx="14"
            fill="url(#glass)"
          />
          <Circle cx="78" cy="94" r="22" fill="url(#glow)" opacity="0.35" />
          <Circle
            cx="78"
            cy="94"
            r="17"
            stroke={colors.info}
            strokeWidth="3"
            fill="none"
          />
          {/* droplet mark */}
          <Path
            d="M78 84 C83 91 86 95 86 99 A8 8 0 0 1 70 99 C70 95 73 91 78 84 Z"
            fill={colors.info}
          />
          <Circle cx="54" cy="124" r="2.5" fill={colors.primary} />
          <Circle cx="64" cy="124" r="2.5" fill="#FFFFFF" opacity="0.4" />
          <Circle cx="74" cy="124" r="2.5" fill="#FFFFFF" opacity="0.4" />

          {/* filter window with water level */}
          <Rect
            x="40"
            y="146"
            width="76"
            height="50"
            rx="12"
            fill="#FFFFFF"
            opacity="0.6"
          />
          <Path
            d="M40 166 C56 160 68 172 84 166 C98 161 108 168 116 164 L116 184 A12 12 0 0 1 104 196 L52 196 A12 12 0 0 1 40 184 Z"
            fill="url(#water)"
          />
          <Rect
            x="40"
            y="146"
            width="76"
            height="50"
            rx="12"
            stroke="#FFFFFF"
            strokeWidth="2"
            fill="none"
          />

          {/* base plinth */}
          <Ellipse
            cx="78"
            cy="211"
            rx="50"
            ry="3"
            fill="#FFFFFF"
            opacity="0.5"
          />
        </Svg>
      </Animated.View>
    </View>
  );
};

export default WaterPurifier3D;

const styles = StyleSheet.create({
  shadow: {
    position: 'absolute',
    bottom: 0, // centred on the plinth line, 12px above the drawing's bottom edge
  },
});
