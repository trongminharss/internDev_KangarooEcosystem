jest.mock('@gorhom/bottom-sheet', () => require('@gorhom/bottom-sheet/mock'));

import '@/core/i18n';
import React from 'react';
import {Text} from 'react-native';
import renderer, {ReactTestRenderer} from 'react-test-renderer';

import {container} from '@/core/di/container';
import {DiscoveredDevice, WifiSelection} from '@/features/device';
import {
  FIND_TIMEOUT_MS,
  SimplePairStage,
} from '@/features/device/presentation/components/simple/SimplePairStage';

jest.mock('@/core/di/container', () => ({
  container: {
    scanDevicesUseCase: {execute: jest.fn()},
    provisionDeviceUseCase: {execute: jest.fn()},
  },
}));

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
const scan = container.scanDevicesUseCase.execute as jest.Mock;
const provision = container.provisionDeviceUseCase.execute as jest.Mock;

const AIR: DiscoveredDevice = {
  id: 'AA:04:5E11',
  name: 'Máy lọc không khí 5E11',
  modelId: 'air-purifier',
  rssi: -74,
};
const WIFI: WifiSelection = {
  credentials: {ssid: 'Kangaroo_Guest', password: ''},
  secured: false,
  rememberWifi: true,
};

const render = async () => {
  let tree!: ReactTestRenderer;
  await renderer.act(async () => {
    tree = renderer.create(
      <SimplePairStage
        modelId="air-purifier"
        wifi={WIFI}
        onBusyChange={jest.fn()}
        onHome={jest.fn()}
        onAgain={jest.fn()}
        onChangeWifi={jest.fn()}
      />,
    );
  });
  return () => tree.root.findAllByType(Text).map(t => String(t.props.children));
};

describe('SimplePairStage (manual path)', () => {
  // entrance / loop animations schedule timers; keep them inside the test
  beforeEach(() => {
    jest.useFakeTimers();
    scan.mockReset();
    provision.mockReset();
  });
  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('scans for the chosen model, then provisions the first match', async () => {
    let report!: (d: DiscoveredDevice) => void;
    scan.mockImplementation(cb => {
      report = cb;
      return jest.fn();
    });
    provision.mockResolvedValue(undefined);

    const texts = await render();
    expect(scan).toHaveBeenCalledWith(expect.any(Function), 'air-purifier');
    expect(texts()).toContain('Đang tìm Máy lọc không khí');

    await renderer.act(async () => report(AIR));
    expect(provision).toHaveBeenCalledWith({deviceId: AIR.id, ...WIFI});
    expect(texts()).toContain('Đã thêm Máy lọc không khí 5E11!');
  });

  it('fails with a hint when the model never shows up', async () => {
    const stop = jest.fn();
    scan.mockReturnValue(stop);

    const texts = await render();
    await renderer.act(async () => {
      jest.advanceTimersByTime(FIND_TIMEOUT_MS);
    });
    expect(stop).toHaveBeenCalled();
    expect(provision).not.toHaveBeenCalled();
    expect(texts()).toContain('Kết nối thất bại');
    expect(texts()).toContain('Thử lại');
  });
});
