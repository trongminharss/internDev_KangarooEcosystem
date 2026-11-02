import 'react-native';
import '@/core/i18n';
import React from 'react';
import {StyleSheet, Text, TextInput} from 'react-native';
import renderer, {
  ReactTestInstance,
  ReactTestRenderer,
} from 'react-test-renderer';

const mockGoBack = jest.fn();

jest.mock('@gorhom/bottom-sheet', () => require('@gorhom/bottom-sheet/mock'));

jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: ({children}: any) => children,
}));

jest.mock('react-native-modal', () => {
  const {createElement} = require('react');
  const MockModal = ({children}: any) => createElement('View', null, children);
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

jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);

jest.mock('react-native-reanimated', () => {
  const {createElement} = require('react');
  const {Text: RNText, View: RNView} = require('react-native');
  const createAnimatedComponent = (Comp: unknown) => (props: any) =>
    createElement(Comp, {
      ...props,
      ...(typeof props.animatedProps === 'object' ? props.animatedProps : null),
    });
  return {
    __esModule: true,
    default: {
      createAnimatedComponent,
      Text: createAnimatedComponent(RNText),
      View: createAnimatedComponent(RNView),
    },
    createAnimatedComponent,
    useSharedValue: (init: number) => ({value: init}),
    useAnimatedStyle: (updater: () => Record<string, unknown>) => updater(),
    useAnimatedProps: (updater: () => Record<string, unknown>) => updater(),
    interpolateColor: (value: number, _inputs: number[], outputs: string[]) =>
      outputs[Math.min(Math.max(Math.round(value), 0), outputs.length - 1)],
    useFrameCallback: () => ({setActive: jest.fn(), isActive: false}),
    useReducedMotion: () => false,
    withTiming: (target: number) => target,
    Easing: {out: (e: unknown) => e, cubic: 'cubic'},
    FadeInDown: {} as Record<string, unknown>,
    FadeOut: {} as Record<string, unknown>,
    LinearTransition: {} as Record<string, unknown>,
  };
});

jest.mock('react-native-keyboard-aware-scroll-view', () => {
  const {createElement} = require('react');
  const {View} = require('react-native');
  return {
    __esModule: true,
    KeyboardAwareScrollView: (props: any) =>
      createElement(View, {
        keyboardShouldPersistTaps: props.keyboardShouldPersistTaps,
        children: props.children,
      }),
  };
});

jest.mock('@/app/navigation/types', () => ({
  useAppNavigation: () => ({goBack: mockGoBack, reset: jest.fn()}),
}));

jest.mock('@/shared/hooks/useSnackbar', () => ({
  useFSnackbar: () => ({showSnackbar: jest.fn(), hideSnackbar: jest.fn()}),
}));

jest.mock('@/features/auth/presentation/hooks/useAuth', () => ({
  useAuth: () => ({
    requestOtp: jest.fn(),
    verifyOtp: jest.fn(),
    isLoading: false,
  }),
}));

let mockCountdown = {seconds: 60, isDone: false, restart: jest.fn()};

jest.mock('@/shared/hooks/useCountdown', () => ({
  useCountdown: () => mockCountdown,
}));

jest.mock('@/core/theme', () => {
  const actual = jest.requireActual('@/core/theme');
  return {
    ...actual,
    useTheme: () => ({
      theme: actual.FTheme,
      isDark: false,
      mode: 'light',
      setMode: jest.fn(),
    }),
  };
});

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useRoute: jest.fn(),
}));

import {useRoute} from '@react-navigation/native';
import FTheme from '@/core/theme/FTheme';
import {FText} from '@/shared/components';
import {OtpScreen} from '@/features/auth/presentation/screens/OtpScreen';

jest.mocked(useRoute).mockReturnValue({
  params: {phoneNumber: '0987123011'},
} as any);

const collectTexts = (root: ReactTestInstance): string[] => {
  const out: string[] = [];
  const walk = (node: any) => {
    if (typeof node === 'string' || typeof node === 'number') {
      out.push(String(node));
      return;
    }
    if (Array.isArray(node)) {
      node.forEach(walk);
    }
  };
  root.findAllByType(Text).forEach(t => walk(t.props.children));
  return out;
};

describe('OtpScreen', () => {
  beforeEach(() => {
    mockCountdown = {seconds: 60, isDone: false, restart: jest.fn()};
  });

  it('renders title, masked phone in the resend row and 6 empty OTP cells', async () => {
    let tree!: ReactTestRenderer;
    await renderer.act(async () => {
      tree = renderer.create(<OtpScreen />);
    });

    const texts = collectTexts(tree.root);
    expect(texts).toContain('Nhập mã Xác thực');
    expect(
      texts.some(
        s => s.includes('Đã gửi tới') && s.includes('0987 123 011'),
      ),
    ).toBe(true);
    expect(texts).toContain('Gửi lại sau 60s');
    expect(tree.root.findAllByType(TextInput)).toHaveLength(6);
  });

  it('renders entered digits across the OTP cells', async () => {
    let tree!: ReactTestRenderer;
    await renderer.act(async () => {
      tree = renderer.create(<OtpScreen />);
    });

    const inputs = tree.root.findAllByType(TextInput);
    await renderer.act(async () => {
      inputs[0].props.onChangeText('1');
    });
    await renderer.act(async () => {
      inputs[1].props.onChangeText('2');
    });
    await renderer.act(async () => {
      inputs[2].props.onChangeText('3');
    });

    const texts = collectTexts(tree.root);
    expect(texts).toContain('1');
    expect(texts).toContain('2');
    expect(texts).toContain('3');
  });

  it('renders the resend link with primary color when countdown allows resend', async () => {
    mockCountdown = {seconds: 0, isDone: true, restart: jest.fn()};
    let tree!: ReactTestRenderer;
    await renderer.act(async () => {
      tree = renderer.create(<OtpScreen />);
    });

    const texts = collectTexts(tree.root);
    expect(texts).toContain('Gửi lại mã');

    const link = tree.root
      .findAllByType(FText)
      .find(t => t.props.children === 'Gửi lại mã');
    expect(link).toBeDefined();
    expect(StyleSheet.flatten(link!.props.style).color).toBe(
      FTheme.colors.primary,
    );
  });
});
