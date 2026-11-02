import React, {
  ComponentType,
  ReactElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {Keyboard, Platform, StyleSheet, View} from 'react-native';
import {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {GestureDetector} from 'react-native-gesture-handler';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';

import {useTheme} from '@/core/theme';
import {tokens} from '@/shared/styles';

import {BarGeometry, MOTION} from '../config/bottomBarMotion';
import {useBottomBarMotion} from '../hooks/useBottomBarMotion';
import {useBottomBarGesture} from '../hooks/useBottomBarGesture';
import {BottomBarItem} from './BottomBarItem';
import {SlidingIndicator} from './SlidingIndicator';

type IconComponentType = ComponentType<{
  width: number;
  height: number;
  color: string;
}>;

/** Our tabBarIcon returns the SVG component directly — extract its type. */
const iconComponent = (element: ReactElement | undefined): IconComponentType =>
  element?.type as IconComponentType;

/**
 * Custom tabBar (spec 8.2): measures layout, mounts indicator + items +
 * gesture arbiter, hides for the keyboard (spec 8.6). Selection source of
 * truth is state.index; the capsule is visual only.
 */
export const AnimatedBottomBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const {t} = useTranslation();
  const {theme, isDark} = useTheme();
  const {colors} = theme;

  const [geometry, setGeometry] = useState<BarGeometry | null>(null);
  const [keyboardUp, setKeyboardUp] = useState(false);
  // Đánh dấu commit: effect đồng bộ state bỏ qua placeAt nếu index mới đến
  // từ commit (capsule đã được snapTo animation), tránh đè mất animation.
  const lastCommitIndexRef = useRef<number | null>(null);

  const keyboardY = useSharedValue(0);
  const keyboardOpacity = useSharedValue(1);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Keyboard: ẩn visual, giữ chỗ layout (spec 8.6). Nếu đang kéo thì gesture
  // tự hủy qua cancelPreview khi state đổi hoặc touch bị hệ thống ngắt.
  useEffect(() => {
    const move = (hidden: boolean) => {
      if (!mountedRef.current) {
        return;
      }
      const target = hidden ? MOTION.barHeight + MOTION.bottomGap : 0;
      keyboardY.value = withTiming(target, {duration: MOTION.keyboardMs});
      keyboardOpacity.value = withTiming(hidden ? 0 : 1, {
        duration: MOTION.keyboardMs,
      });
      setKeyboardUp(hidden);
    };
    const showSub = Keyboard.addListener('keyboardDidShow', () => move(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => move(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardY, keyboardOpacity]);

  const motion = useBottomBarMotion();
  const routeKeys = state.routes.map(route => route.key);
  const activeIndex = state.index;

  const commitSelection = useCallback(
    (routeKey: string) => {
      if (!mountedRef.current) {
        return;
      }
      const route = state.routes.find(item => item.key === routeKey);
      if (!route) {
        if (geometry) {
          motion.snapTo(geometry, state.index, 'restore');
        }
        return;
      }
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (geometry) {
        if (event.defaultPrevented) {
          // Bị chặn: capsule quay về tab active thực tế (NAV-13).
          motion.snapTo(geometry, state.index, 'restore');
        } else {
          motion.snapTo(
            geometry,
            state.routes.findIndex(item => item.key === routeKey),
            'snap',
          );
        }
      }
      if (
        !event.defaultPrevented &&
        route.key !== state.routes[state.index]?.key
      ) {
        lastCommitIndexRef.current = state.routes.findIndex(item =>
          item.key === routeKey,
        );
        navigation.navigate(route.name);
      }
    },
    [state, navigation, geometry, motion],
  );

  const gesture = useBottomBarGesture({
    routeKeys,
    motion,
    geometry,
    activeIndex,
    commitSelection,
  });

  // Capsule phải phản ánh navigation state: lần đầu/rotation → placeAt ngay
  // (NAV-01/15); đổi tab do commit → đã có snap animation, bỏ qua; đổi từ
  // ngoài (back/deep link) → cancel preview + placeAt (NAV-14).
  useEffect(() => {
    if (!geometry) {
      return;
    }
    if (lastCommitIndexRef.current === state.index) {
      lastCommitIndexRef.current = null;
      return;
    }
    gesture.cancelPreview(state.index);
    motion.placeAt(geometry, state.index);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.index, geometry]);

  const keyboardStyle = useAnimatedStyle(() => ({
    transform: [{translateY: keyboardY.value}],
    opacity: keyboardOpacity.value,
  }));

  const onBarLayout = useCallback(
    (width: number) => {
      lastCommitIndexRef.current = null;
      setGeometry({
        barWidth: width,
        padding: MOTION.barPadding,
        tabCount: state.routes.length,
      });
    },
    [state.routes.length],
  );

  const shadowStyle = Platform.select({
    ios: {
      shadowColor: '#2F2F2F',
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: isDark ? 0.45 : 0.05,
      shadowRadius: 16,
    },
    android: {
      elevation: 55,
    },
  });

  return (
    <Animated.View
      testID="bottom-bar"
      onLayout={event => onBarLayout(event.nativeEvent.layout.width)}
      style={[
        styles.bar,
        {
          height: MOTION.barHeight,
          bottom: Math.max(insets.bottom, MOTION.bottomGap),
          marginHorizontal: tokens.space.md,
          borderRadius: tokens.borderRadius.big,
          backgroundColor: colors.tabBar.background,
          borderColor: colors.tabBar.border,
        },
        shadowStyle,
        keyboardStyle,
      ]}>
      <View pointerEvents={keyboardUp ? 'none' : 'auto'} style={styles.fill}>
        <GestureDetector gesture={gesture.composed}>
          <View style={styles.fill}>
            {geometry && (
              <SlidingIndicator
                edgeLeft={motion.edgeLeft}
                edgeRight={motion.edgeRight}
                opacity={motion.capsuleOpacity}
                geometry={geometry}
                top={MOTION.barPadding}
                height={MOTION.capsuleHeight}
                color={colors.tabBar.indicator}
              />
            )}
            {/* Padding nằm CHỈ ở hàng icons: capsule absolute tính toạ độ
                từ View không padding (khớp geometry padding 6 từ mép bar),
                tránh đếm padding hai lớp làm lệch capsule/icons (+6pt). */}
            <View style={styles.items}>
              {state.routes.map((route, index) => {
                const options = descriptors[route.key]?.options;
                const icon = iconComponent(
                  options?.tabBarIcon?.({
                    focused: state.index === index,
                    color: '',
                    size: MOTION.iconSize,
                  }) as ReactElement | undefined,
                );
                return (
                  <BottomBarItem
                    key={route.key}
                    label={
                      options?.tabBarAccessibilityLabel ??
                      t(`tab.${route.name.toLowerCase()}`)
                    }
                    selected={state.index === index}
                    Icon={icon}
                    scale={motion.iconScales[index]}
                    onActivate={() => gesture.selectTab(route.key)}
                  />
                );
              })}
            </View>
          </View>
        </GestureDetector>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderWidth: StyleSheet.hairlineWidth,
  },
  fill: {
    flex: 1,
  },
  items: {
    flex: 1,
    flexDirection: 'row',
    // Geometry-coupled: must match MOTION.barPadding used by tabCenterX —
    // exempt from spacing tokens per AGENTS.md.
    padding: MOTION.barPadding,
  },
});
