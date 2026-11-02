import {View} from 'react-native';
import React from 'react';
import renderer, {ReactTestRenderer} from 'react-test-renderer';

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
  };
});

jest.mock('@/core/theme', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        tabBar: {
          background: '#FFFFFF',
          indicator: 'rgba(0,0,0,0.1)',
          iconActive: '#44BA46',
          iconInactive: '#A2ADC4',
          border: '#E7ECF4',
        },
      },
    },
    isDark: false,
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 0, bottom: 34, left: 0, right: 0}),
}));

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

jest.mock('react-native-haptic-feedback', () => ({
  default: {trigger: jest.fn()},
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({t: (key: string) => key}),
}));

import {useSharedValue} from 'react-native-reanimated';

import {MOTION} from '@/app/navigation/config/bottomBarMotion';
import {AnimatedBottomBar} from '@/app/navigation/components/AnimatedBottomBar';
import {BottomBarItem} from '@/app/navigation/components/BottomBarItem';
import {SlidingIndicator} from '@/app/navigation/components/SlidingIndicator';
import type {
  BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import type {TabNavigationState} from '@react-navigation/routers';
import type {BottomTabParamList} from '@/app/navigation/types';

describe('SlidingIndicator', () => {
  it('renders an absolute, non-interactive capsule', () => {
    let tree!: ReactTestRenderer;

    const Probe = () => {
      const edgeLeft = useSharedValue(8);
      const edgeRight = useSharedValue(92);
      const opacity = useSharedValue(1);
      return (
        <SlidingIndicator
          edgeLeft={edgeLeft}
          edgeRight={edgeRight}
          opacity={opacity}
          geometry={{barWidth: 364, padding: MOTION.barPadding, tabCount: 4}}
          top={MOTION.barPadding}
          height={MOTION.capsuleHeight}
          color="#FF0000"
        />
      );
    };

    renderer.act(() => {
      tree = renderer.create(<Probe />);
    });

    const capsule = tree.root.findByProps({testID: 'sliding-indicator'});
    const style = Array.isArray(capsule.props.style)
      ? Object.assign({}, ...capsule.props.style.filter(Boolean))
      : capsule.props.style;
    expect(style.position).toBe('absolute');
    expect(capsule.props.pointerEvents).toBe('none');
  });
});

const FakeIcon = ({
  width,
  height,
  color,
}: {
  width: number;
  height: number;
  color: string;
}) => <View testID="fake-icon" {...{width, height, color}} />;

describe('BottomBarItem', () => {
  it('renders tab role, label, selected state and 26x26 themed icon', () => {
    let tree!: ReactTestRenderer;

    const Probe = () => {
      const scale = useSharedValue(1);
      return (
        <BottomBarItem
          label="Trang chủ"
          selected
          Icon={FakeIcon}
          scale={scale}
          onActivate={jest.fn()}
        />
      );
    };

    renderer.act(() => {
      tree = renderer.create(<Probe />);
    });

    const item = tree.root.findByProps({accessibilityRole: 'tab'});
    expect(item.props.accessibilityLabel).toBe('Trang chủ');
    expect(item.props.accessibilityState).toEqual({selected: true});

    const icon = tree.root.findByProps({testID: 'fake-icon'});
    expect(icon.props.width).toBe(26);
    expect(icon.props.height).toBe(26);
    expect(icon.props.color).toBe('#44BA46');
  });

  it('fires onActivate on accessibility activate action', () => {
    let tree!: ReactTestRenderer;
    const onActivate = jest.fn();

    const Probe = () => {
      const scale = useSharedValue(1);
      return (
        <BottomBarItem
          label="Tài khoản"
          selected={false}
          Icon={FakeIcon}
          scale={scale}
          onActivate={onActivate}
        />
      );
    };

    renderer.act(() => {
      tree = renderer.create(<Probe />);
    });

    const item = tree.root.findByProps({accessibilityRole: 'tab'});
    expect(item.props.accessibilityState).toEqual({selected: false});
    renderer.act(() => {
      item.props.onAccessibilityAction({
        nativeEvent: {actionName: 'activate'},
      });
    });
    expect(onActivate).toHaveBeenCalledTimes(1);
  });
});

const ROUTE_NAMES: (keyof BottomTabParamList)[] = [
  'Home',
  'Automation',
  'Service',
  'Store',
];

const makeState = (
  index: number,
): TabNavigationState<BottomTabParamList> => ({
  key: 'tab-root',
  index,
  stale: false,
  type: 'tab',
  routeNames: [...ROUTE_NAMES],
  routes: ROUTE_NAMES.map(name => ({
    key: `route-${name}`,
    name,
    params: undefined,
  })),
  history: [{type: 'route', key: `route-${ROUTE_NAMES[index]}`}],
  preloadedRouteKeys: [],
});

const makeProps = (index: number): BottomTabBarProps => {
  const state = makeState(index);
  return {
    state,
    descriptors: Object.fromEntries(
      state.routes.map(route => [
        route.key,
        {
          route,
          navigation: {} as never,
          options: {
            tabBarAccessibilityLabel: route.name,
            tabBarIcon: () => <FakeIcon width={26} height={26} color="#000" />,
          },
          render: () => null,
        },
      ]),
    ) as unknown as BottomTabBarProps['descriptors'],
    navigation: {
      emit: jest.fn(() => ({defaultPrevented: false})),
      navigate: jest.fn(),
    } as never,
  } as unknown as BottomTabBarProps;
};

describe('AnimatedBottomBar', () => {
  it('renders 4 tabs and marks only state.index as selected', () => {
    let tree!: ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(<AnimatedBottomBar {...makeProps(2)} />);
    });

    const tabs = tree.root.findAllByProps({accessibilityRole: 'tab'});
    expect(tabs).toHaveLength(4);
    const selected = tabs.filter(
      tab => tab.props.accessibilityState.selected === true,
    );
    expect(selected).toHaveLength(1);
    expect(selected[0].props.accessibilityLabel).toBe('Service');
  });

  it('emits exactly one tabPress and navigates once on selectTab', () => {
    let tree!: ReactTestRenderer;
    const props = makeProps(0);
    renderer.act(() => {
      tree = renderer.create(<AnimatedBottomBar {...props} />);
    });

    const tabs = tree.root.findAllByProps({accessibilityRole: 'tab'});
    renderer.act(() => {
      tabs[3].props.onAccessibilityAction({
        nativeEvent: {actionName: 'activate'},
      });
    });

    expect(props.navigation.emit).toHaveBeenCalledTimes(1);
    expect(props.navigation.emit).toHaveBeenCalledWith(
      expect.objectContaining({type: 'tabPress', target: 'route-Store'}),
    );
    expect(props.navigation.navigate).toHaveBeenCalledWith('Store');
  });

  it('does not navigate when tabPress is prevented (NAV-13)', () => {
    let tree!: ReactTestRenderer;
    const props = makeProps(0);
    (props.navigation.emit as jest.Mock).mockReturnValue({
      defaultPrevented: true,
    });
    renderer.act(() => {
      tree = renderer.create(<AnimatedBottomBar {...props} />);
    });

    const tabs = tree.root.findAllByProps({accessibilityRole: 'tab'});
    renderer.act(() => {
      tabs[1].props.onAccessibilityAction({
        nativeEvent: {actionName: 'activate'},
      });
    });

    expect(props.navigation.navigate).not.toHaveBeenCalled();
  });
});
