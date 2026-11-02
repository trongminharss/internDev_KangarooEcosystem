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

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  const navigate = jest.fn();
  return {...actual, useNavigation: () => ({navigate}), __navigate: navigate};
});

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

// Extra barrel-dep mocks, copied from __tests__/HomeScreen.test.tsx.

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

import React from 'react';
import renderer from 'react-test-renderer';
import {ThemeProvider} from '@/core/theme';
import DeviceSection, {
  DeviceGridHeader,
} from '@/features/home/presentation/components/DeviceSection';
import ConnectedDevicePanel from '@/features/home/presentation/components/ConnectedDevicePanel';
import DeviceCard from '@/features/home/presentation/components/DeviceCard';
import {
  ProductSectionBody,
  ProductSectionTitle,
} from '@/features/home/presentation/components/ProductSection';
import {MOCK_CONNECTED} from '@/features/home/presentation/mocks/mockHome';

type Status = 'loading' | 'success' | 'error' | 'empty';

const render = async (ui: React.ReactElement) => {
  let tree!: renderer.ReactTestRenderer;
  await renderer.act(async () => {
    tree = renderer.create(<ThemeProvider>{ui}</ThemeProvider>);
  });
  return tree;
};

describe('DeviceSection', () => {
  it('shows a skeleton while loading', async () => {
    const tree = await render(
      <DeviceSection
        status={'loading' as Status}
        onConnect={jest.fn()}
        onRetry={jest.fn()}
      />,
    );
    expect(tree.root.findByProps({testID: 'device-skeleton'})).toBeTruthy();
    expect(tree.root.findAllByProps({testID: 'device-banner'}).length).toBe(0);
  });

  it('shows the banner only when the device list is confirmed empty', async () => {
    const tree = await render(
      <DeviceSection
        status={'empty' as Status}
        onConnect={jest.fn()}
        onRetry={jest.fn()}
      />,
    );
    expect(tree.root.findByProps({testID: 'device-banner'})).toBeTruthy();
  });

  it('renders the connected panel when success carries data', async () => {
    const tree = await render(
      <DeviceSection
        status={'success' as Status}
        data={MOCK_CONNECTED}
        onConnect={jest.fn()}
        onRetry={jest.fn()}
      />,
    );
    expect(tree.root.findByProps({testID: 'device-panel'})).toBeTruthy();
  });

  it('renders nothing for success without data (defensive guard)', async () => {
    const tree = await render(
      <DeviceSection
        status={'success' as Status}
        data={undefined}
        onConnect={jest.fn()}
        onRetry={jest.fn()}
      />,
    );
    expect(tree.toJSON()).toBeNull();
  });

  it('shows an error with retry', async () => {
    const onRetry = jest.fn();
    const tree = await render(
      <DeviceSection
        status={'error' as Status}
        onConnect={jest.fn()}
        onRetry={onRetry}
      />,
    );
    expect(tree.root.findByProps({testID: 'device-error'})).toBeTruthy();
    await renderer.act(async () => {
      tree.root.findByProps({testID: 'device-retry'}).props.onPress();
    });
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe('DeviceGridHeader', () => {
  it('renders the grid title and the add button', async () => {
    const tree = await render(<DeviceGridHeader />);
    expect(
      tree.root.findByProps({children: 'Thiết bị nổi bật'}),
    ).toBeTruthy();
    expect(tree.root.findByProps({testID: 'device-more'})).toBeTruthy();
  });

  it('navigates to AddDevice on add press', async () => {
    const nav = require('@react-navigation/native') as {
      __navigate: jest.Mock;
    };
    const tree = await render(<DeviceGridHeader />);
    await renderer.act(async () => {
      tree.root.findByProps({testID: 'device-more'}).props.onPress();
    });
    expect(nav.__navigate).toHaveBeenCalledWith('AddDevice');
  });
});

describe('ConnectedDevicePanel', () => {
  it('renders quality label and grade', async () => {
    const tree = await render(<ConnectedDevicePanel data={MOCK_CONNECTED} />);
    expect(tree.root.findByProps({testID: 'device-panel'})).toBeTruthy();
    expect(tree.root.findByProps({children: 'Tuyệt vời'})).toBeTruthy();
    // react-test-renderer 19 matches composites + RN internals + host Text:
    // count only host Text nodes — 'A+' renders twice (grade + filtered pill).
    expect(
      tree.root
        .findAllByProps({children: 'A+'})
        .filter(n => (n.type as string) === 'Text').length,
    ).toBe(2);
  });

  it('renders the animated wave background with the device status', async () => {
    const tree = await render(<ConnectedDevicePanel data={MOCK_CONNECTED} />);
    expect(tree.root.findByProps({status: 'normal'})).toBeTruthy();

    const warning = {...MOCK_CONNECTED, status: 'warning' as const};
    const warningTree = await render(
      <ConnectedDevicePanel data={warning} />,
    );
    expect(warningTree.root.findByProps({status: 'warning'})).toBeTruthy();
  });

  it('renders the three stat pills', async () => {
    const tree = await render(<ConnectedDevicePanel data={MOCK_CONNECTED} />);
    expect(tree.root.findByProps({children: '85%'})).toBeTruthy();
    expect(tree.root.findByProps({children: '214'})).toBeTruthy();
    expect(tree.root.findByProps({children: 'Nguồn vào'})).toBeTruthy();
    expect(
      tree.root
        .findAllByProps({children: 'A+'})
        .filter(n => (n.type as string) === 'Text').length,
    ).toBeGreaterThan(1);
  });
});

describe('DeviceCard', () => {
  const device = {
    id: 'd1',
    room: 'Phòng khách',
    name: 'Máy lọc nước',
    statusText: 'Tốt',
  };

  it('renders room, name and status', async () => {
    const tree = await render(<DeviceCard device={device} onPress={jest.fn()} />);
    expect(tree.root.findByProps({testID: 'device-card-d1'})).toBeTruthy();
    expect(tree.root.findByProps({children: 'Phòng khách'})).toBeTruthy();
    expect(tree.root.findByProps({children: 'Máy lọc nước'})).toBeTruthy();
    expect(tree.root.findByProps({children: 'Tốt'})).toBeTruthy();
  });

  it('invokes onPress from the card pressable', async () => {
    const onPress = jest.fn();
    const tree = await render(<DeviceCard device={device} onPress={onPress} />);
    await renderer.act(async () => {
      tree.root.findByProps({testID: 'device-card-d1'}).props.onPress();
    });
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('ProductSection', () => {
  it('renders the section title', async () => {
    const tree = await render(<ProductSectionTitle />);
    expect(tree.root.findByProps({children: 'Khám phá sản phẩm'})).toBeTruthy();
  });

  it('shows a 2-column skeleton while loading', async () => {
    const tree = await render(
      <ProductSectionBody status={'loading' as Status} onRetry={jest.fn()} />,
    );
    expect(tree.root.findByProps({testID: 'product-skeleton'})).toBeTruthy();
  });

  it('shows the empty message', async () => {
    const tree = await render(
      <ProductSectionBody status={'empty' as Status} onRetry={jest.fn()} />,
    );
    expect(tree.root.findByProps({children: 'Chưa có sản phẩm'})).toBeTruthy();
  });

  it('shows an error with retry', async () => {
    const onRetry = jest.fn();
    const tree = await render(
      <ProductSectionBody status={'error' as Status} onRetry={onRetry} />,
    );
    expect(tree.root.findByProps({testID: 'product-error'})).toBeTruthy();
    await renderer.act(async () => {
      tree.root.findByProps({testID: 'product-retry'}).props.onPress();
    });
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders nothing for success (grid is rendered by the FlatList)', async () => {
    const tree = await render(
      <ProductSectionBody status={'success' as Status} onRetry={jest.fn()} />,
    );
    expect(tree.toJSON()).toBeNull();
  });
});
