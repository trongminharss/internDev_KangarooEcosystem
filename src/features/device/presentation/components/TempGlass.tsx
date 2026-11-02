import React, {useEffect, useRef} from 'react';
import {Animated, Easing, StyleSheet, View} from 'react-native';
import Svg, {ClipPath, Defs, G, Path, Rect} from 'react-native-svg';
import {useTheme} from '@/core/theme';
import {WaterChannelKey} from '../purifierUtils';

interface Props {
  channel: WaterChannelKey;
  /** 0 = coolest end of the channel's range, 1 = hottest. */
  intensity: number;
  on: boolean;
  water: string;
}

const W = 72;
const H = 90;
const STEAM_H = 26;
const GLASS = 'M10 4 L62 4 L56 58 Q55.4 62 51 62 L21 62 Q16.6 62 16 58 Z';

/** Glass of water that steams when hot and floats ice cubes when cold. */
export const TempGlass: React.FC<Props> = ({channel, intensity, on, water}) => {
  const {theme} = useTheme();
  const {colors} = theme;
  const rise = useRef(new Animated.Value(0)).current;
  const steaming = on && channel === 'hot';

  useEffect(() => {
    if (!steaming) {
      rise.stopAnimation();
      rise.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(rise, {
        toValue: 1,
        duration: 2200,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [rise, steaming]);

  // Hotter water is served fuller; ice takes the room in cold water.
  const level = 22 + (1 - intensity) * 6;
  const cubes =
    on && channel === 'cold' ? 1 + Math.round((1 - intensity) * 2) : 0;
  const wisps = steaming ? 1 + Math.round(intensity * 2) : 0;

  return (
    <View style={styles.box}>
      <Animated.View
        style={[
          styles.steam,
          {
            opacity: rise.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0, 0.35 + intensity * 0.55, 0],
            }),
            transform: [
              {
                translateY: rise.interpolate({
                  inputRange: [0, 1],
                  outputRange: [6, -8],
                }),
              },
            ],
          },
        ]}>
        <Svg width={W} height={STEAM_H}>
          {[26, 36, 46].slice(0, wisps).map((x, i) => (
            <Path
              key={x}
              d={`M${x} ${STEAM_H - 2} q-6 -${5 + i} 0 -${10 + i} t0 -${
                10 + i
              }`}
              stroke={colors.body}
              strokeWidth={2}
              strokeLinecap="round"
              fill="none"
            />
          ))}
        </Svg>
      </Animated.View>
      <Svg width={W} height={H - STEAM_H}>
        <Defs>
          <ClipPath id="glass">
            <Path d={GLASS} />
          </ClipPath>
        </Defs>
        <G clipPath="url(#glass)">
          <Path
            d={`M0 ${level} q9 -4 18 0 t18 0 t18 0 t18 0 V64 H0 Z`}
            fill={on ? water : colors.border2}
            fillOpacity={0.9}
          />
          {Array.from({length: cubes}, (_, i) => (
            <Rect
              key={i}
              x={20 + i * 12}
              y={level - 4 + (i % 2) * 8}
              width={13}
              height={13}
              rx={3}
              fill={colors.onDarkPrimary}
              fillOpacity={0.55}
              rotation={i % 2 ? -14 : 12}
              origin={`${26 + i * 12}, ${level + 2 + (i % 2) * 8}`}
            />
          ))}
          <Rect
            x={18}
            y={10}
            width={3}
            height={36}
            rx={1.5}
            fill={colors.onDarkPrimary}
            fillOpacity={0.18}
          />
        </G>
        <Path
          d={GLASS}
          stroke={colors.subtitle}
          strokeWidth={2}
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </View>
  );
};

export default TempGlass;

const styles = StyleSheet.create({
  box: {
    width: W,
    height: H,
  },
  steam: {
    height: STEAM_H,
  },
});
