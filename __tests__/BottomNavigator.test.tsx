import 'react-native';
import React from 'react';
import renderer, {ReactTestRenderer} from 'react-test-renderer';
import {NavigationContainer} from '@react-navigation/native';
import '@/core/i18n';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
  clear: jest.fn().mockResolvedValue(undefined),
}));

jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);

jest.mock('react-native-gesture-handler', () => {
  const RN = require('react-native');
  const chainable = () => {
    const g: Record<string, unknown> = {};
    [
      'maxDuration',
      'minDuration',
      'maxDeltaX',
      'maxDeltaY',
      'maxDistance',
      'onStart',
      'onUpdate',
      'onEnd',
      'onFinalize',
      'onTouchesDown',
      'onTouchesMove',
      'onTouchesUp',
      'shouldCancelWhenOutside',
      'enabled',
      'activateAfterLongPress',
      'minPointers',
      'maxPointers',
    ].forEach(method => {
      g[method] = () => g;
    });
    return g;
  };
  return {
    Gesture: {
      Tap: chainable,
      LongPress: chainable,
      Pan: chainable,
      Exclusive: (...gestures: unknown[]) => gestures[0],
    },
    GestureDetector: (props: {children: React.ReactNode}) => (
      <RN.View>{props.children}</RN.View>
    ),
    runOnJS: (fn: unknown) => fn,
  };
});

jest.mock('react-native-reanimated', () => {
  // Host-string View: a function wrapper would double-match deep
  // findAllByProps (wrapper fiber + host fiber share spread props).
  return {
    __esModule: true,
    default: {View: 'View'},
    View: 'View',
    useSharedValue: (init: number) => ({value: init}),
    useAnimatedStyle: (updater: () => Record<string, unknown>) => updater(),
    withTiming: (value: number) => value,
    withSpring: (value: number) => value,
    cancelAnimation: () => undefined,
    useReducedMotion: () => false,
    runOnJS: (fn: unknown) => fn,
  };
});

jest.mock('react-native-haptic-feedback', () => ({
  default: {trigger: jest.fn()},
}));

jest.mock('@/features/home', () => ({
  HomeScreen: () => null,
}));
jest.mock('@/features/automation', () => ({
  AutomationScreen: () => null,
}));
jest.mock('@/features/service', () => ({
  ServiceScreen: () => null,
}));
jest.mock('@/features/store', () => ({
  StoreScreen: () => null,
}));

import {ThemeProvider} from '@/core/theme';
import {FTheme} from '@/core/theme/FTheme';
import {BottomNavigator} from '@/app/navigation/BottomNavigator';

describe('BottomNavigator', () => {
  it('renders 4 tab icons at 26x26 with tabBar themed colors', async () => {
    let tree!: ReactTestRenderer;
    await renderer.act(async () => {
      tree = renderer.create(
        <ThemeProvider>
          <NavigationContainer>
            <BottomNavigator />
          </NavigationContainer>
        </ThemeProvider>,
      );
    });

    // Custom bar renders 1 icon per route (old default bar rendered an
    // active+inactive pair → 8). 4 tabs × 1 = 4.
    const svgIcons = tree.root.findAllByType('SvgMock' as any);
    expect(svgIcons.length).toBe(4);

    svgIcons.forEach(icon => {
      expect(icon.props.width).toBe(26);
      expect(icon.props.height).toBe(26);
    });

    const colors = svgIcons.map(icon => icon.props.color);
    expect(
      colors.filter(c => c === FTheme.colors.tabBar.iconActive),
    ).toHaveLength(1);
    expect(
      colors.filter(c => c === FTheme.colors.tabBar.iconInactive),
    ).toHaveLength(3);
  });

  it('has exactly one selected tab and mounts the sliding indicator', async () => {
    let tree!: ReactTestRenderer;
    await renderer.act(async () => {
      tree = renderer.create(
        <ThemeProvider>
          <NavigationContainer>
            <BottomNavigator />
          </NavigationContainer>
        </ThemeProvider>,
      );
    });

    const tabs = tree.root.findAllByProps({accessibilityRole: 'tab'});
    expect(tabs).toHaveLength(4);
    const selected = tabs.filter(
      tab => tab.props.accessibilityState.selected === true,
    );
    expect(selected).toHaveLength(1);
    expect(selected[0].props.accessibilityLabel).toBe('Trang chủ');

    // Kích hoạt onLayout thủ công vì react-test-renderer không đo layout.
    const bar = tree.root.findByProps({testID: 'bottom-bar'});
    renderer.act(() => {
      bar.props.onLayout({nativeEvent: {layout: {width: 364}}});
    });
    expect(tree.root.findByProps({testID: 'sliding-indicator'})).toBeTruthy();
  });
});
