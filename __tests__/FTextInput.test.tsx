import 'react-native';
import React from 'react';
import {StyleSheet, TextInput, ViewStyle} from 'react-native';
import renderer, {ReactTestRenderer} from 'react-test-renderer';

import FTextInput from '@/shared/components/FTextInput';
import FTheme from '@/core/theme/FTheme';

const renderInput = async (
  props: Partial<React.ComponentProps<typeof FTextInput>> = {},
) => {
  let tree!: ReactTestRenderer;
  await renderer.act(async () => {
    tree = renderer.create(
      <FTextInput
        placeholder="Nhập tên"
        value=""
        onChangeText={() => {}}
        onClear={() => {}}
        {...props}
      />,
    );
  });
  return tree;
};

const containerStyle = (tree: ReactTestRenderer): ViewStyle =>
  StyleSheet.flatten(
    tree.root.findByProps({testID: 'f-text-input-container'}).props.style,
  ) as ViewStyle;

const input = (tree: ReactTestRenderer) => tree.root.findByType(TextInput);

describe('FTextInput', () => {
  it('default: border1 border, white background, pill radius, placeholder', async () => {
    const tree = await renderInput();
    expect(containerStyle(tree).borderColor).toBe(FTheme.colors.border1);
    expect(containerStyle(tree).backgroundColor).toBe(FTheme.colors.white);
    expect(containerStyle(tree).borderRadius).toBe(999);
    expect(input(tree).props.placeholder).toBe('Nhập tên');
    expect(input(tree).props.placeholderTextColor).toBe(
      FTheme.colors.placeHolder,
    );
  });

  it('focus toggles border to primary and back', async () => {
    const tree = await renderInput({value: 'giá trị'});
    await renderer.act(async () => {
      input(tree).props.onFocus();
    });
    expect(containerStyle(tree).borderColor).toBe(FTheme.colors.primary);
    await renderer.act(async () => {
      input(tree).props.onBlur();
    });
    expect(containerStyle(tree).borderColor).toBe(FTheme.colors.border1);
  });

  it('error: error border and red helper text', async () => {
    const tree = await renderInput({
      value: 'abc',
      errorText: 'Email không hợp lệ',
    });
    expect(containerStyle(tree).borderColor).toBe(FTheme.colors.error);
    expect(
      tree.root.findByProps({children: 'Email không hợp lệ'}),
    ).toBeTruthy();
  });

  it('disabled: grey1 background, not editable, disable colors', async () => {
    const tree = await renderInput({disabled: true});
    expect(containerStyle(tree).backgroundColor).toBe(FTheme.colors.grey1);
    expect(input(tree).props.editable).toBe(false);
    expect(input(tree).props.placeholderTextColor).toBe(FTheme.colors.disable);
  });
});
