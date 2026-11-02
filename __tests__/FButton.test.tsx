import 'react-native';
import React from 'react';
import {StyleSheet, Text, ViewStyle} from 'react-native';
import renderer, {ReactTestRenderer} from 'react-test-renderer';

import FButton from '@/shared/components/FButton';
import FTheme from '@/core/theme/FTheme';

const renderButton = async (disabled?: boolean) => {
  let tree!: ReactTestRenderer;
  await renderer.act(async () => {
    tree = renderer.create(
      <FButton
        testID="button"
        title="Tiếp tục"
        onPress={() => {}}
        disabled={disabled}
      />,
    );
  });
  return tree;
};

const buttonStyle = (tree: ReactTestRenderer): ViewStyle => {
  // Pressable (composite) also carries testID — pick the resolved host View.
  const button = tree.root
    .findAllByProps({testID: 'button'})
    .find(el => String(el.type) === 'View')!;
  return StyleSheet.flatten(button.props.style) as ViewStyle;
};

describe('FButton', () => {
  it('enabled uses primary background and white text', async () => {
    const tree = await renderButton(false);
    expect(buttonStyle(tree).backgroundColor).toBe(FTheme.colors.primary);
    const text = tree.root.findByType(Text);
    expect(StyleSheet.flatten(text.props.style)!.color).toBe(
      FTheme.colors.onDarkPrimary,
    );
  });

  it('disabled renders solid grey pill without opacity fade', async () => {
    const tree = await renderButton(true);
    expect(buttonStyle(tree).backgroundColor).toBe(FTheme.colors.disable);
    expect(buttonStyle(tree).opacity).toBeUndefined();
    const text = tree.root.findByType(Text);
    expect(StyleSheet.flatten(text.props.style)!.color).toBe(
      FTheme.colors.body,
    );
  });
});
