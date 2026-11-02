import React from 'react';
import {StyleSheet} from 'react-native';
import Animated, {useAnimatedStyle} from 'react-native-reanimated';
import type {SharedValue} from 'react-native-reanimated';

import {BarGeometry, capsuleEdges} from '../config/bottomBarMotion';

interface SlidingIndicatorProps {
  edgeLeft: SharedValue<number>;
  edgeRight: SharedValue<number>;
  opacity: SharedValue<number>;
  /** Static measured values — only read, never animated. */
  geometry: BarGeometry;
  top: number;
  height: number;
  color: string;
}

/**
 * The active-tab capsule. Render-only: reads shared values written by the
 * motion hook, never handles touch or navigation (spec 8.2).
 */
export const SlidingIndicator = ({
  edgeLeft,
  edgeRight,
  opacity,
  geometry,
  top,
  height,
  color,
}: SlidingIndicatorProps) => {
  const style = useAnimatedStyle(() => {
    const center = (edgeLeft.value + edgeRight.value) / 2;
    const half = Math.max((edgeRight.value - edgeLeft.value) / 2, 0);
    const {left, width} = capsuleEdges(center, half, geometry);
    return {left, width, opacity: opacity.value};
  });

  return (
    <Animated.View
      testID="sliding-indicator"
      pointerEvents="none"
      style={[
        styles.base,
        style,
        // Geometry-coupled values derived from bar measurement — exempt from
        // spacing tokens per AGENTS.md.
        {top, height, borderRadius: height / 2, backgroundColor: color},
      ]}
    />
  );
};

const styles = StyleSheet.create({
  base: {
    position: 'absolute',
  },
});
