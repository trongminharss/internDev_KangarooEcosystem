import 'react-native';
import '@/core/i18n';

const mockReplace = jest.fn();

jest.mock('@gorhom/bottom-sheet', () => require('@gorhom/bottom-sheet/mock'));

jest.mock('@/app/navigation/types', () => ({
  useAppNavigation: () => ({replace: mockReplace}),
}));

jest.mock('@/core/utils/storage', () => ({
  Storage: {
    KEY_FIRST_LOAD: 'isFirstTimeLoadApp',
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);

jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: ({children}: any) => children,
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
  Text: ({children}: any) => children,
  createAnimatableComponent: (Comp: any) => Comp,
}));

jest.mock('rn-tooltip', () => ({
  __esModule: true,
  default: ({children}: any) => children,
}));

let mockReduceMotion = false;

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
    useFrameCallback: () => ({
      setActive: jest.fn(),
      isActive: true,
      callbackId: -1,
    }),
    useReducedMotion: () => mockReduceMotion,
    withTiming: (target: number) => target,
    Easing: {out: (e: unknown) => e, cubic: 'cubic'},
  };
});

import React from 'react';
import renderer, {ReactTestRenderer} from 'react-test-renderer';
import {Path} from 'react-native-svg';
import {ThemeProvider} from '@/core/theme';
import {OnboardingScreen} from '@/features/onboarding/presentation/screens/OnboardingScreen';
import {Storage} from '@/core/utils/storage';

const renderOnboarding = async () => {
  let tree!: ReactTestRenderer;
  await renderer.act(async () => {
    tree = renderer.create(
      <ThemeProvider>
        <OnboardingScreen />
      </ThemeProvider>,
    );
  });
  return tree;
};

const pressByTestID = async (tree: ReactTestRenderer, testID: string) => {
  const node = tree.root.findByProps({testID});
  await renderer.act(async () => {
    node.props.onPress();
  });
};

const pressByText = async (tree: ReactTestRenderer, text: string) => {
  let pressable = tree.root.findByProps({children: text}).parent;
  while (pressable && typeof pressable.props.onPress !== 'function') {
    pressable = pressable.parent;
  }
  await renderer.act(async () => {
    pressable?.props.onPress();
  });
};

describe('OnboardingScreen', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    (Storage.setItem as jest.Mock).mockClear();
  });

  it('renders 3 slides with titles and 3 animated dots, first active', async () => {
    const tree = await renderOnboarding();

    [
      'Một ứng dụng, trọn hệ sinh thái',
      'Điều khiển mọi lúc, mọi nơi',
      'An tâm cùng Kangaroo',
    ].forEach(title => {
      expect(
        tree.root.findAll(
          node =>
            typeof node.props.children === 'string' &&
            node.props.children.includes(title),
        ).length,
      ).toBeGreaterThan(0);
    });

    const dotStyle = (i: number) => {
      const dot = tree.root.findByProps({testID: `onboarding-dot-${i}`});
      const styles = Array.isArray(dot.props.style)
        ? dot.props.style
        : [dot.props.style];
      return Object.assign({}, ...styles);
    };

    expect(dotStyle(0).width.toJSON()).toBe(20);
    expect(dotStyle(1).width.toJSON()).toBe(8);
    expect(dotStyle(2).width.toJSON()).toBe(8);
    expect(dotStyle(0).backgroundColor).not.toBe(dotStyle(1).backgroundColor);

    expect(
      tree.root
        .findAllByProps({fill: 'url(#waveGradBack)'})
        .filter(instance => instance.type === Path),
    ).toHaveLength(1);
  });

  it('finishes on the last slide Start: persists flag and replaces to PhoneLogin', async () => {
    const tree = await renderOnboarding();

    await pressByText(tree, 'Tiếp');
    await pressByText(tree, 'Tiếp');
    expect(tree.root.findByProps({children: 'Bắt đầu'})).toBeTruthy();
    await pressByText(tree, 'Bắt đầu');

    expect(Storage.setItem).toHaveBeenCalledWith('isFirstTimeLoadApp', false);
    expect(mockReplace).toHaveBeenCalledWith('PhoneLogin');
  });

  it('Skip persists the flag and replaces to PhoneLogin', async () => {
    const tree = await renderOnboarding();

    await pressByTestID(tree, 'onboarding-skip');

    expect(Storage.setItem).toHaveBeenCalledWith('isFirstTimeLoadApp', false);
    expect(mockReplace).toHaveBeenCalledWith('PhoneLogin');
  });
});
