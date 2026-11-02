import 'react-native';
import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import renderer, {ReactTestRenderer} from 'react-test-renderer';

import FCheckbox from '@/shared/components/Checkbox';
import FTheme from '@/core/theme/FTheme';

const renderCheckbox = async (
  props: React.ComponentProps<typeof FCheckbox>,
): Promise<ReactTestRenderer> => {
  let tree!: ReactTestRenderer;
  await renderer.act(async () => {
    tree = renderer.create(<FCheckbox {...props} />);
  });
  return tree;
};

const boxStyle = (tree: ReactTestRenderer) => {
  const box = tree.root
    .findAllByType(View)
    .find(v => StyleSheet.flatten(v.props.style)?.width === 20);
  return StyleSheet.flatten(box!.props.style);
};

describe('FCheckbox', () => {
  it('renders title text, unchecked box uses grey border', async () => {
    const tree = await renderCheckbox({checked: false, onPress: () => {}});
    expect(tree.root.findAllByType(Text)).toHaveLength(0);
    expect(boxStyle(tree).borderColor).toBe(FTheme.colors.grey2);
  });

  it('checked box uses primary background and shows title', async () => {
    const tree = await renderCheckbox({
      checked: true,
      onPress: () => {},
      title: 'Đồng ý',
    });
    expect(boxStyle(tree).backgroundColor).toBe(FTheme.colors.primary);
    const texts = tree.root.findAllByType(Text);
    expect(texts.some(t => t.props.children === 'Đồng ý')).toBe(true);
  });

  it('children view replaces plain title', async () => {
    const tree = await renderCheckbox({
      checked: false,
      onPress: () => {},
      title: 'fallback',
      children: <Text>Điều khoản</Text>,
    });
    const texts = tree.root.findAllByType(Text);
    expect(texts.some(t => t.props.children === 'Điều khoản')).toBe(true);
    expect(texts.some(t => t.props.children === 'fallback')).toBe(false);
  });
});
