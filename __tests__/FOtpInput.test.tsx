import 'react-native';
import '@/core/i18n';
import React from 'react';
import {Keyboard, StyleSheet, Text, TextInput} from 'react-native';
import renderer, {
  ReactTestInstance,
  ReactTestRenderer,
} from 'react-test-renderer';

const mockDismiss = jest
  .spyOn(Keyboard, 'dismiss')
  .mockImplementation(() => {});

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
    interpolateColor: (value: number, _inputs: number[], outputs: string[]) =>
      outputs[Math.min(Math.max(Math.round(value), 0), outputs.length - 1)],
    withTiming: (target: number) => target,
    FadeInDown: {} as Record<string, unknown>,
    FadeOut: {} as Record<string, unknown>,
    LinearTransition: {} as Record<string, unknown>,
  };
});

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

const mockGetString = jest.fn<Promise<string>, []>();
jest.mock('@react-native-clipboard/clipboard', () => ({
  __esModule: true,
  default: {getString: () => mockGetString()},
}));

import FTheme from '@/core/theme/FTheme';
import FOtpInput from '@/shared/components/FOtpInput';

const typeInto = async (
  inputs: ReactTestInstance[],
  code: string,
): Promise<void> => {
  for (let i = 0; i < code.length; i++) {
    await renderer.act(async () => {
      inputs[i].props.onChangeText(code[i]);
    });
  }
};

const getDigits = (tree: ReactTestRenderer): string[] =>
  tree.root
    .findAllByType(Text)
    .map(t => String(t.props.children))
    .filter(s => s.length === 1 && s !== '-');

describe('FOtpInput', () => {
  it('renders 6 cells and reports the typed code through onCodeChanged', async () => {
    const onCodeChanged = jest.fn();
    let tree!: ReactTestRenderer;

    await renderer.act(async () => {
      tree = renderer.create(
        <FOtpInput otpCount={6} onCodeChanged={onCodeChanged} />,
      );
    });

    const inputs = tree.root.findAllByType(TextInput);
    expect(inputs).toHaveLength(6);

    await typeInto(inputs, 'ab1');

    expect(onCodeChanged).toHaveBeenLastCalledWith('AB1');
    expect(getDigits(tree)).toEqual(['A', 'B', '1']);
  });

  it('moves focus forward on Backspace and clears the previous digit', async () => {
    let tree!: ReactTestRenderer;

    await renderer.act(async () => {
      tree = renderer.create(<FOtpInput otpCount={6} />);
    });

    const inputs = tree.root.findAllByType(TextInput);
    await typeInto(inputs, '12');

    await renderer.act(async () => {
      inputs[2].props.onKeyPress({nativeEvent: {key: 'Backspace'}});
    });

    expect(getDigits(tree)).toEqual(['1']);
  });

  it('dismisses the keyboard when the code is complete', async () => {
    const onCodeChanged = jest.fn();
    let tree!: ReactTestRenderer;

    await renderer.act(async () => {
      tree = renderer.create(
        <FOtpInput otpCount={4} onCodeChanged={onCodeChanged} />,
      );
    });

    mockDismiss.mockClear();

    const inputs = tree.root.findAllByType(TextInput);
    await typeInto(inputs, '9w8z');

    expect(onCodeChanged).toHaveBeenLastCalledWith('9W8Z');
    expect(mockDismiss).toHaveBeenCalled();
  });

  it('fills all cells when a full code is pasted and dismisses the keyboard', async () => {
    const onCodeChanged = jest.fn();
    let tree!: ReactTestRenderer;

    await renderer.act(async () => {
      tree = renderer.create(
        <FOtpInput otpCount={6} onCodeChanged={onCodeChanged} />,
      );
    });

    mockDismiss.mockClear();

    const inputs = tree.root.findAllByType(TextInput);
    await renderer.act(async () => {
      inputs[0].props.onChangeText('123456');
    });

    expect(getDigits(tree)).toEqual(['1', '2', '3', '4', '5', '6']);
    expect(onCodeChanged).toHaveBeenLastCalledWith('123456');
    expect(mockDismiss).toHaveBeenCalled();
  });

  it('extracts the OTP from a pasted SMS message', async () => {
    let tree!: ReactTestRenderer;

    await renderer.act(async () => {
      tree = renderer.create(<FOtpInput otpCount={6} />);
    });

    const inputs = tree.root.findAllByType(TextInput);
    await renderer.act(async () => {
      inputs[2].props.onChangeText(
        'KGR: Ma OTP cua ban la 098123. Khong chia se',
      );
    });

    expect(getDigits(tree)).toEqual(['0', '9', '8', '1', '2', '3']);
  });

  it('fills cells from the start for a partial paste and focuses the next cell', async () => {
    let tree!: ReactTestRenderer;

    await renderer.act(async () => {
      tree = renderer.create(<FOtpInput otpCount={4} />);
    });

    const inputs = tree.root.findAllByType(TextInput);
    await renderer.act(async () => {
      inputs[0].props.onChangeText('ab');
    });

    expect(getDigits(tree)).toEqual(['A', 'B']);
  });

  it('reports a rejected paste when no valid characters are pasted', async () => {
    const onPasteRejected = jest.fn();
    let tree!: ReactTestRenderer;

    await renderer.act(async () => {
      tree = renderer.create(
        <FOtpInput otpCount={4} onPasteRejected={onPasteRejected} />,
      );
    });

    const inputs = tree.root.findAllByType(TextInput);
    await renderer.act(async () => {
      inputs[0].props.onChangeText('--@--');
    });

    expect(onPasteRejected).toHaveBeenCalledWith('--@--');
    expect(getDigits(tree)).toEqual([]);
  });

  it('pastes the clipboard contents on long-press', async () => {
    mockGetString.mockResolvedValue('KGR: Ma OTP 123456');
    let tree!: ReactTestRenderer;

    await renderer.act(async () => {
      tree = renderer.create(<FOtpInput otpCount={6} />);
    });

    const overlays = tree.root.findAll(
      node => typeof node.props.onLongPress === 'function',
    );
    await renderer.act(async () => {
      await overlays[0].props.onLongPress();
    });

    expect(getDigits(tree)).toEqual(['1', '2', '3', '4', '5', '6']);
    mockGetString.mockClear();
  });

  it('renders digits with the bodyLabel02 typography token', async () => {
    let tree!: ReactTestRenderer;

    await renderer.act(async () => {
      tree = renderer.create(<FOtpInput otpCount={3} />);
    });

    const inputs = tree.root.findAllByType(TextInput);
    await typeInto(inputs, '7');

    const digit = tree.root
      .findAllByType(Text)
      .find(t => t.props.children === '7');
    const flattened = StyleSheet.flatten(digit!.props.style);
    expect(flattened.fontFamily).toBe(FTheme.fonts.bodyLabel02.fontFamily);
    expect(flattened.color).toBe(FTheme.colors.label);
  });

  it('renders "-" placeholder in empty cells', async () => {
    let tree!: ReactTestRenderer;

    await renderer.act(async () => {
      tree = renderer.create(<FOtpInput otpCount={4} />);
    });

    const dashes = tree.root
      .findAllByType(Text)
      .map(t => String(t.props.children))
      .filter(s => s === '-');
    expect(dashes).toHaveLength(4);
  });
});
