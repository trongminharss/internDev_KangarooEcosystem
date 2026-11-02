/**
 * @format
 */

jest.mock('@notifee/react-native', () => ({
  EventType: {DISMISSED: 0, PRESS: 1},
  onForegroundEvent: jest.fn(),
  requestPermission: jest.fn(),
  createChannel: jest.fn(),
  displayNotification: jest.fn(),
}));

jest.mock('@react-native-firebase/messaging', () => ({
  getMessaging: jest.fn(),
  getToken: jest.fn().mockResolvedValue('mock-token'),
  deleteToken: jest.fn(),
  registerDeviceForRemoteMessages: jest.fn(),
  unregisterDeviceForRemoteMessages: jest.fn(),
  isDeviceRegisteredForRemoteMessages: jest.fn().mockReturnValue(true),
  requestPermission: jest.fn().mockResolvedValue(1),
  onMessage: jest.fn().mockReturnValue(jest.fn()),
  onNotificationOpenedApp: jest.fn(),
  getInitialNotification: jest.fn().mockResolvedValue(null),
  AuthorizationStatus: {AUTHORIZED: 1, PROVISIONAL: 2},
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
  clear: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('react-native-gesture-handler', () => {
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
    GestureHandlerRootView: ({children}: any) => children,
    Gesture: {
      Tap: chainable,
      LongPress: chainable,
      Pan: chainable,
      Exclusive: (...gestures: unknown[]) => gestures[0],
    },
    GestureDetector: ({children}: any) => children,
  };
});

jest.mock('react-native-haptic-feedback', () => ({
  default: {trigger: jest.fn()},
}));

jest.mock('react-native-webview', () => ({WebView: () => null}));

jest.mock('lottie-react-native', () => {
  const React = require('react');
  const MockLottieView = () => React.createElement('View', null);
  MockLottieView.default = MockLottieView;
  return MockLottieView;
});

jest.mock('react-native-modal', () => {
  const React = require('react');
  const MockModal = ({children}: any) =>
    React.createElement('View', null, children);
  MockModal.default = MockModal;
  return MockModal;
});

jest.mock('react-native-animatable', () => ({
  View: ({children}: any) => children,
  Text: ({children}: any) => children,
  createAnimatableComponent: (Comp: any) => Comp,
}));

jest.mock('rn-tooltip', () => ({
  __esModule: true,
  default: ({children}: any) => children,
}));

jest.mock('react-native-reanimated', () => {
  const {createElement} = require('react');
  const createAnimatedComponent = (Comp: unknown) => (props: any) =>
    createElement(Comp, {
      ...props,
      ...(typeof props.animatedProps === 'object' ? props.animatedProps : null),
    });
  return {
    __esModule: true,
    default: {createAnimatedComponent, View: 'View'},
    createAnimatedComponent,
    View: 'View',
    useSharedValue: (init: number) => ({value: init}),
    useAnimatedProps: (updater: () => Record<string, unknown>) => updater(),
    useAnimatedStyle: (updater: () => Record<string, unknown>) => updater(),
    useFrameCallback: () => ({
      setActive: jest.fn(),
      isActive: true,
      callbackId: -1,
    }),
    useReducedMotion: () => false,
    withTiming: (target: number) => target,
    withSpring: (target: number) => target,
    cancelAnimation: () => undefined,
    runOnJS: (fn: unknown) => fn,
    Easing: {out: (e: unknown) => e, cubic: 'cubic'},
  };
});

jest.mock('@gorhom/bottom-sheet', () => ({
  BottomSheetModalProvider: ({children}: any) => children,
}));

jest.mock('react-native-keyboard-aware-scroll-view', () => ({
  KeyboardAwareScrollView: ({children}: any) => children,
}));

jest.mock('react-native-popup-menu', () => ({
  MenuProvider: ({children}: any) => children,
}));

jest.mock('react-native-paper', () => ({
  PaperProvider: ({children}: any) => children,
  Snackbar: ({children}: any) => children,
  MD3LightTheme: {colors: {}, fonts: {}},
  MD3DarkTheme: {colors: {}, fonts: {}},
}));

jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);

import 'react-native';
import React from 'react';
import App from '../App';

// Note: import explicitly to use the types shiped with jest.
import {it} from '@jest/globals';

// Note: test renderer must be required after react-native.
import renderer from 'react-test-renderer';

it('renders correctly', async () => {
  jest.useFakeTimers();
  await renderer.act(async () => {
    renderer.create(<App />);
    jest.runOnlyPendingTimers();
  });
  jest.useRealTimers();
});
