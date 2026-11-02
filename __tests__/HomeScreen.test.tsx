import {StyleSheet} from 'react-native';
import '@/core/i18n';

jest.mock('@gorhom/bottom-sheet', () => require('@gorhom/bottom-sheet/mock'));

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

jest.mock('react-native-webview', () => ({WebView: () => null}));

jest.mock('react-native-keyboard-aware-scroll-view', () => ({
  KeyboardAwareScrollView: ({children}: any) => children,
}));

jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: ({children}: any) => children,
  TouchableWithoutFeedback: ({children}: any) => children,
}));

jest.mock('react-native-modal', () => {
  const React = require('react');
  const MockModal = ({children}: any) =>
    React.createElement('View', null, children);
  MockModal.default = MockModal;
  return MockModal;
});

jest.mock('react-native-animatable', () => ({
  View: ({children}: any) => children,
  initializeRegistryWithDefinitions: jest.fn(),
}));

jest.mock('rn-tooltip', () => ({
  __esModule: true,
  default: ({children}: any) => children,
}));

jest.mock('react-native-svg', () => {
  const React = require('react');
  const pass = ({children}: any) => React.createElement('View', null, children);
  const none = () => null;
  return {
    __esModule: true,
    default: pass,
    SvgXml: none,
    Svg: pass,
    Circle: none,
    Defs: pass,
    Ellipse: none,
    G: pass,
    LinearGradient: pass,
    Path: none,
    RadialGradient: pass,
    Rect: none,
    Stop: none,
  };
});

jest.mock('react-native-animated-spinkit', () => ({
  Pulse: () => null,
  Bounce: () => null,
}));

jest.mock('@react-native-assets/slider', () => ({
  Slider: () => null,
  RangeSlider: () => null,
}));

jest.mock('react-native-step-indicator', () => () => null);

jest.mock('react-native-reanimated', () => {
  const {createElement} = require('react');
  const createAnimatedComponent = (Comp: unknown) => (props: any) =>
    createElement(Comp, {
      ...props,
      ...(typeof props.animatedProps === 'object' ? props.animatedProps : null),
    });
  const AnimatedView = ({children, style}: any) =>
    createElement('View', {style}, children);
  return {
    __esModule: true,
    default: {createAnimatedComponent, View: AnimatedView},
    createAnimatedComponent,
    View: AnimatedView,
    withTiming: (toValue: number) => toValue,
    withRepeat: (animation: number) => animation,
    Easing: {linear: 'linear'},
    useSharedValue: (init: number) => ({value: init}),
    useAnimatedProps: (updater: () => Record<string, unknown>) => updater(),
    useAnimatedStyle: (updater: () => Record<string, unknown>) => updater(),
    useFrameCallback: () => ({setActive: jest.fn(), isActive: true}),
    useReducedMotion: () => false,
  };
});

jest.mock('react-native-paper', () => {
  const React = require('react');
  const pass = ({children}: any) => children;
  const view = ({children}: any) => React.createElement('View', null, children);
  const Dialog: any = view;
  Dialog.Title = view;
  Dialog.Content = view;
  Dialog.Actions = view;
  return {
    Appbar: {Header: view},
    IconButton: view,
    Dialog,
    Portal: pass,
    Snackbar: view,
    ActivityIndicator: view,
    TextInput: view,
  };
});

jest.mock('@/features/home/presentation/mocks/mockHome', () => ({
  MOCK_PRODUCTS: [
    {id: 'p1', name: 'Máy lọc nước KGR 01H23', price: 250000, badge: 'hot'},
    {id: 'p2', name: 'Máy lọc nước KGR 01H23', price: 250000, badge: 'new'},
  ],
  loadDeviceRegion: jest.fn(),
  loadProductRegion: jest.fn(),
}));

// Home is rendered without a NavigationContainer; treat it as always focused
jest.mock('@react-navigation/native', () => {
  const {useEffect} = require('react');
  const actual = jest.requireActual('@react-navigation/native');
  const navigate = jest.fn();
  return {
    ...actual,
    useNavigation: () => ({navigate}),
    useFocusEffect: (effect: () => void | (() => void)) =>
      useEffect(effect, [effect]),
    __navigate: navigate,
  };
});

import React from 'react';
import renderer, {ReactTestRenderer} from 'react-test-renderer';
import {DarkTheme, FTheme, ThemeProvider} from '@/core/theme';
import {HomeScreen} from '@/features/home/presentation/screens/HomeScreen';
import {
  loadDeviceRegion,
  loadProductRegion,
} from '@/features/home/presentation/mocks/mockHome';

const mockLoadDevice = loadDeviceRegion as jest.Mock;
const mockLoadProduct = loadProductRegion as jest.Mock;

const navModule = () =>
  require('@react-navigation/native') as any as {__navigate: jest.Mock};

const renderHome = async (theme?: any) => {
  let tree!: ReactTestRenderer;
  await renderer.act(async () => {
    tree = renderer.create(
      <ThemeProvider theme={theme}>
        <HomeScreen />
      </ThemeProvider>,
    );
  });
  return tree;
};

const successProducts = () => ({
  status: 'success',
  items: [
    {id: 'p1', name: 'Máy lọc nước KGR 01H23', price: 250000, badge: 'hot'},
    {id: 'p2', name: 'Máy lọc nước KGR 01H23', price: 250000, badge: 'new'},
  ],
});

const connectedData = () => ({
  grade: 'A+',
  gradePpm: '3.2',
  qualityLabel: 'Tuyệt vời',
  stats: {efficiency: '85%', filtered: '12.4L', inputPpm: '214'},
  devices: [
    {id: 'd1', room: 'Phòng khách', name: 'Máy lọc nước', statusText: 'Tốt'},
    {id: 'd2', room: 'Phòng khách', name: 'Máy lọc nước', statusText: 'Tốt'},
  ],
  status: 'normal',
});

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  navModule().__navigate.mockClear();
});

afterEach(async () => {
  await renderer.act(async () => {
    jest.runOnlyPendingTimers();
  });
  jest.useRealTimers();
});

describe('HomeScreen', () => {
  it('renders header, banner, title, cards and see-more in image order', async () => {
    mockLoadDevice.mockResolvedValue({status: 'empty'});
    mockLoadProduct.mockResolvedValue(successProducts());
    const tree = await renderHome();

    const instances = tree.root.findAll(() => true);
    const position = (testID: string) =>
      instances.findIndex(node => node.props.testID === testID);
    const order = [
      'home-header',
      'device-banner',
      'product-card-p1',
      'product-card-p2',
      'see-more',
    ].map(position);
    order.forEach(index => expect(index).toBeGreaterThanOrEqual(0));
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it('shows skeletons while regions are loading, no banner', async () => {
    mockLoadDevice.mockReturnValue(new Promise(() => {}));
    mockLoadProduct.mockReturnValue(new Promise(() => {}));
    const tree = await renderHome();

    expect(tree.root.findByProps({testID: 'device-skeleton'})).toBeTruthy();
    expect(tree.root.findByProps({testID: 'product-skeleton'})).toBeTruthy();
    expect(tree.root.findAllByProps({testID: 'device-banner'}).length).toBe(0);
    expect(tree.root.findAllByProps({testID: 'see-more'}).length).toBe(0);
  });

  it('device error does not block the product grid', async () => {
    mockLoadDevice.mockResolvedValue({status: 'error'});
    mockLoadProduct.mockResolvedValue(successProducts());
    const tree = await renderHome();

    expect(tree.root.findByProps({testID: 'device-error'})).toBeTruthy();
    expect(tree.root.findByProps({testID: 'product-card-p1'})).toBeTruthy();
    expect(tree.root.findByProps({testID: 'see-more'})).toBeTruthy();
  });

  it('empty products hides see-more and shows the empty message', async () => {
    mockLoadDevice.mockResolvedValue({status: 'empty'});
    mockLoadProduct.mockResolvedValue({status: 'empty', items: []});
    const tree = await renderHome();

    expect(tree.root.findByProps({testID: 'product-empty'})).toBeTruthy();
    expect(tree.root.findAllByProps({testID: 'see-more'}).length).toBe(0);
  });

  it('product error shows retry and no cards', async () => {
    mockLoadDevice.mockResolvedValue({status: 'empty'});
    mockLoadProduct.mockResolvedValue({status: 'error', items: []});
    const tree = await renderHome();

    expect(tree.root.findByProps({testID: 'product-error'})).toBeTruthy();
    expect(tree.root.findAllByProps({testID: 'product-card-p1'}).length).toBe(
      0,
    );
  });

  it('avatar navigates to Account; cart and card presses do not navigate', async () => {
    mockLoadDevice.mockResolvedValue({status: 'empty'});
    mockLoadProduct.mockResolvedValue(successProducts());
    const tree = await renderHome();

    await renderer.act(async () => {
      tree.root.findByProps({testID: 'avatar-button'}).props.onPress();
    });
    expect(navModule().__navigate).toHaveBeenCalledWith('Account');

    navModule().__navigate.mockClear();
    await renderer.act(async () => {
      tree.root.findByProps({testID: 'product-cart-p1'}).props.onPress();
    });
    await renderer.act(async () => {
      tree.root.findByProps({testID: 'product-card-p1'}).props.onPress();
    });
    expect(navModule().__navigate).not.toHaveBeenCalled();
  });

  it('connected state swaps the grid for device cards, no see-more', async () => {
    mockLoadDevice.mockResolvedValue({status: 'success', data: connectedData()});
    mockLoadProduct.mockResolvedValue(successProducts());
    const tree = await renderHome();

    const instances = tree.root.findAll(() => true);
    const position = (testID: string) =>
      instances.findIndex(node => node.props.testID === testID);
    const order = [
      'home-header',
      'device-panel',
      'device-card-d1',
      'device-card-d2',
    ].map(position);
    order.forEach(index => expect(index).toBeGreaterThanOrEqual(0));
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(tree.root.findAllByProps({testID: 'see-more'}).length).toBe(0);
    expect(tree.root.findAllByProps({testID: 'product-card-p1'}).length).toBe(
      0,
    );
  });

  it('connected add-device press navigates to AddDevice', async () => {
    mockLoadDevice.mockResolvedValue({status: 'success', data: connectedData()});
    mockLoadProduct.mockResolvedValue(successProducts());
    const tree = await renderHome();

    await renderer.act(async () => {
      tree.root.findByProps({testID: 'device-more'}).props.onPress();
    });
    expect(navModule().__navigate).toHaveBeenCalledWith('AddDevice');
  });

  it('adapts container background to light mode and dark mode', async () => {
    mockLoadDevice.mockResolvedValue({status: 'empty'});
    mockLoadProduct.mockResolvedValue(successProducts());

    const lightTree = await renderHome(FTheme);
    const lightContainer = lightTree.root.findByProps({testID: 'home-screen'});
    expect(
      StyleSheet.flatten(lightContainer.props.style).backgroundColor,
    ).toBe(FTheme.colors.background);

    const darkTree = await renderHome(DarkTheme);
    const darkContainer = darkTree.root.findByProps({testID: 'home-screen'});
    expect(
      StyleSheet.flatten(darkContainer.props.style).backgroundColor,
    ).toBe(DarkTheme.colors.background);
  });

  it('renders background gradient covering the screen', async () => {
    mockLoadDevice.mockResolvedValue({status: 'empty'});
    mockLoadProduct.mockResolvedValue(successProducts());

    const darkTree = await renderHome(DarkTheme);
    const gradient = darkTree.root.findByProps({
      testID: 'home-gradient-svg',
    });
    const flattenedStyle = StyleSheet.flatten(gradient.props.style);
    expect(flattenedStyle.top).toBe(0);
    expect(flattenedStyle.bottom).toBe(0);
    expect(flattenedStyle.left).toBe(0);
    expect(flattenedStyle.right).toBe(0);
  });

  it('pops the nearby water purifier sheet once permissions are granted', async () => {
    mockLoadDevice.mockResolvedValue({status: 'empty'});
    mockLoadProduct.mockResolvedValue(successProducts());
    const tree = await renderHome();
    const connect = () => tree.root.findAllByProps({children: 'Kết nối'});
    expect(connect()).toHaveLength(0);

    // the simulated purifier advertises 2.5s into the scan
    await renderer.act(async () => {
      jest.advanceTimersByTime(3000);
    });

    expect(connect().length).toBeGreaterThan(0);
    expect(
      tree.root.findAllByProps({children: 'Máy lọc nước 7F3A'}).length,
    ).toBeGreaterThan(0);
  });
});
