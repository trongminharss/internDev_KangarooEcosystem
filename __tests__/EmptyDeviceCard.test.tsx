import 'react-native';
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

jest.mock('react-native-svg', () => {
  const React = require('react');
  const pass = ({children}: any) => React.createElement('View', null, children);
  return {
    __esModule: true,
    default: pass,
    SvgXml: () => null,
    Svg: pass,
    Defs: pass,
    LinearGradient: pass,
    Stop: () => null,
    Rect: () => null,
    Path: () => null,
  };
});

// Extra mocks: the @/shared/components barrel transitively pulls ESM-only deps
// (copied from __tests__/HomeScreen.test.tsx, per repo convention).

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
  return {
    __esModule: true,
    default: {createAnimatedComponent},
    createAnimatedComponent,
    useSharedValue: (init: number) => ({value: init}),
    useAnimatedProps: (updater: () => Record<string, unknown>) => updater(),
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

import React from 'react';
import renderer from 'react-test-renderer';
import {DarkTheme, FTheme, ThemeProvider} from '@/core/theme';
import EmptyDeviceCard from '@/features/home/presentation/components/EmptyDeviceCard';

describe('EmptyDeviceCard', () => {
  const renderCard = async (onConnect: jest.Mock, theme?: any) => {
    let tree!: renderer.ReactTestRenderer;
    await renderer.act(async () => {
      tree = renderer.create(
        <ThemeProvider theme={theme}>
          <EmptyDeviceCard onConnect={onConnect} />
        </ThemeProvider>,
      );
    });
    return tree;
  };

  it('renders the empty-device message and the CTA', async () => {
    const tree = await renderCard(jest.fn());
    expect(tree.root.findByProps({testID: 'device-banner'})).toBeTruthy();
    expect(
      tree.root.findByProps({children: 'Chưa có thiết bị nào được ghép nối'}),
    ).toBeTruthy();
    expect(tree.root.findByProps({children: 'Kết nối ngay'})).toBeTruthy();
  });

  it('calls onConnect when the CTA is pressed', async () => {
    const onConnect = jest.fn();
    const tree = await renderCard(onConnect);
    await renderer.act(async () => {
      tree.root.findByProps({testID: 'device-connect'}).props.onPress();
    });
    expect(onConnect).toHaveBeenCalledTimes(1);
  });

  it('adapts text color to light mode and dark mode', async () => {
    const lightTree = await renderCard(jest.fn(), FTheme);
    const lightMessage = lightTree.root.findByProps({
      children: 'Chưa có thiết bị nào được ghép nối',
    });
    expect(lightMessage.props.color).toBe(FTheme.colors.title);

    const darkTree = await renderCard(jest.fn(), DarkTheme);
    const darkMessage = darkTree.root.findByProps({
      children: 'Chưa có thiết bị nào được ghép nối',
    });
    expect(darkMessage.props.color).toBe(DarkTheme.colors.title);
  });
});
