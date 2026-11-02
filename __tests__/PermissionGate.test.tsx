import '@/core/i18n';
import React from 'react';
import {Text} from 'react-native';
import renderer, {ReactTestRenderer} from 'react-test-renderer';

import {PermissionGate} from '@/features/device/presentation/components/PermissionGate';
import {PermissionMap} from '@/features/device/presentation/hooks/useDevicePermissions';

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

jest.mock('react-native-svg', () => ({
  SvgXml: () => null,
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
      ...(typeof props.animatedProps === 'object'
        ? props.animatedProps
        : null),
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

const render = async (status: PermissionMap, anyBlocked: boolean) => {
  const onRequest = jest.fn();
  const onOpenSettings = jest.fn();
  let tree!: ReactTestRenderer;
  await renderer.act(async () => {
    tree = renderer.create(
      <PermissionGate
        status={status}
        anyBlocked={anyBlocked}
        onRequest={onRequest}
        onOpenSettings={onOpenSettings}
      />,
    );
  });
  const texts = tree.root
    .findAllByType(Text)
    .map(t => String(t.props.children));
  const button = tree.root
    .findAll(n => typeof n.props.onPress === 'function')
    .pop()!;
  return {texts, button, onRequest, onOpenSettings};
};

describe('PermissionGate', () => {
  it('shows each status, the mandatory warning, and asks again', async () => {
    const {texts, button, onRequest} = await render(
      {bluetooth: 'granted', wifi: 'denied', location: 'denied'},
      false,
    );
    expect(texts).toContain('Đã cấp quyền');
    expect(texts.filter(t => t === 'Chưa cấp quyền')).toHaveLength(2);
    expect(texts).toContain(
      'Bạn cần cấp đủ các quyền trên mới có thể tiếp tục thêm thiết bị.',
    );
    expect(texts).toContain('Cấp quyền');
    renderer.act(() => button.props.onPress());
    expect(onRequest).toHaveBeenCalled();
  });

  it('sends the user to Settings when a permission is blocked', async () => {
    const {texts, button, onOpenSettings} = await render(
      {bluetooth: 'blocked', wifi: 'granted', location: 'granted'},
      true,
    );
    expect(texts).toContain('Đã bị từ chối, bật lại trong Cài đặt');
    expect(texts).toContain('Mở Cài đặt');
    renderer.act(() => button.props.onPress());
    expect(onOpenSettings).toHaveBeenCalled();
  });
});
