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

jest.mock('react-native-svg', () => ({
  SvgXml: () => null,
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
import {ThemeProvider} from '@/core/theme';
import {
  getGreetingKey,
  HomeHeader,
} from '@/features/home/presentation/components/HomeHeader';

describe('getGreetingKey', () => {
  it('maps hours to greeting keys', () => {
    expect(getGreetingKey(4)).toBe('evening');
    expect(getGreetingKey(0)).toBe('evening');
    expect(getGreetingKey(5)).toBe('morning');
    expect(getGreetingKey(10)).toBe('morning');
    expect(getGreetingKey(11)).toBe('noon');
    expect(getGreetingKey(12)).toBe('noon');
    expect(getGreetingKey(13)).toBe('afternoon');
    expect(getGreetingKey(17)).toBe('afternoon');
    expect(getGreetingKey(18)).toBe('evening');
    expect(getGreetingKey(23)).toBe('evening');
  });
});

describe('HomeHeader', () => {
  const renderHeader = async () => {
    let tree!: renderer.ReactTestRenderer;
    await renderer.act(async () => {
      tree = renderer.create(
        <ThemeProvider>
          <HomeHeader onAvatarPress={jest.fn()} />
        </ThemeProvider>,
      );
    });
    return tree;
  };

  it('renders a greeting text and an avatar button', async () => {
    const tree = await renderHeader();
    expect(tree.root.findByProps({testID: 'home-header'})).toBeTruthy();
    expect(tree.root.findByProps({testID: 'avatar-button'})).toBeTruthy();
    const texts = tree.root.findAll(
      node =>
        typeof node.props.children === 'string' &&
        (node.props.children as string).startsWith('Chào buổi'),
    );
    expect(texts.length).toBeGreaterThanOrEqual(1);
  });

  it('calls onAvatarPress when the avatar is pressed', async () => {
    const onAvatarPress = jest.fn();
    let tree!: renderer.ReactTestRenderer;
    await renderer.act(async () => {
      tree = renderer.create(
        <ThemeProvider>
          <HomeHeader onAvatarPress={onAvatarPress} />
        </ThemeProvider>,
      );
    });
    await renderer.act(async () => {
      tree.root.findByProps({testID: 'avatar-button'}).props.onPress();
    });
    expect(onAvatarPress).toHaveBeenCalledTimes(1);
  });
});
