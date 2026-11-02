import React, {useEffect} from 'react';
import {AccessibilityActionEvent, StyleSheet} from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import {useTheme} from '@/core/theme';

import {MOTION} from '../config/bottomBarMotion';

interface BottomBarItemProps {
  label: string;
  selected: boolean;
  Icon: React.ComponentType<{width: number; height: number; color: string}>;
  scale: SharedValue<number>;
  onActivate: () => void;
}

/**
 * One tab: icon + accessibility. Selection color follows the real navigation
 * state only — never the drag preview (spec 5.2 / 9). No filled/outline SVG
 * pair exists in the repo, so selection is color/opacity only (spec 3.3).
 */
export const BottomBarItem = ({
  label,
  selected,
  Icon,
  scale,
  onActivate,
}: BottomBarItemProps) => {
  const {colors} = useTheme().theme;
  const opacity = useSharedValue(1);

  // Crossfade: short opacity dip when selection lands on this tab (spec 7).
  useEffect(() => {
    if (!selected) {
      return;
    }
    opacity.value = MOTION.crossfadeDip;
    opacity.value = withTiming(1, {duration: MOTION.crossfadeMs});
  }, [selected, opacity]);

  const anim = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
    opacity: opacity.value,
  }));

  const handleAccessibilityAction = (e: AccessibilityActionEvent) => {
    if (e.nativeEvent.actionName === 'activate') {
      onActivate();
    }
  };

  return (
    <Animated.View
      accessible
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{selected}}
      accessibilityActions={[{name: 'activate'}]}
      onAccessibilityAction={handleAccessibilityAction}
      style={[styles.item, anim]}>
      <Icon
        width={MOTION.iconSize}
        height={MOTION.iconSize}
        color={selected ? colors.tabBar.iconActive : colors.tabBar.iconInactive}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
