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

import React from 'react';
import renderer from 'react-test-renderer';
import {ThemeProvider} from '@/core/theme';
import {
  formatPrice,
  ProductCard,
} from '@/features/home/presentation/components/ProductCard';
import {MockProduct} from '@/features/home/presentation/mocks/mockHome';

const baseProduct: MockProduct = {
  id: 'p1',
  name: 'Máy lọc nước KGR 01H23',
  price: 250000,
};

const renderCard = async (
  product: MockProduct,
  onPress: jest.Mock,
  onAddToCart: jest.Mock,
) => {
  let tree!: renderer.ReactTestRenderer;
  await renderer.act(async () => {
    tree = renderer.create(
      <ThemeProvider>
        <ProductCard
          product={product}
          onPress={onPress}
          onAddToCart={onAddToCart}
        />
      </ThemeProvider>,
    );
  });
  return tree;
};

describe('formatPrice', () => {
  it('formats with dot thousand separators and đ suffix', () => {
    expect(formatPrice(250000)).toBe('250.000đ');
    expect(formatPrice(0)).toBe('0đ');
    expect(formatPrice(1234567)).toBe('1.234.567đ');
  });
});

describe('ProductCard', () => {
  it('renders name, price and no badge when badge is absent', async () => {
    const tree = await renderCard(baseProduct, jest.fn(), jest.fn());
    expect(
      tree.root.findByProps({children: 'Máy lọc nước KGR 01H23'}),
    ).toBeTruthy();
    expect(tree.root.findByProps({children: '250.000đ'})).toBeTruthy();
    expect(tree.root.findAllByProps({testID: 'product-badge-p1'}).length).toBe(
      0,
    );
  });

  it('renders HOT and Mới badges from data', async () => {
    const hot = await renderCard(
      {...baseProduct, badge: 'hot'},
      jest.fn(),
      jest.fn(),
    );
    expect(hot.root.findByProps({children: 'HOT'})).toBeTruthy();
    const moi = await renderCard(
      {...baseProduct, badge: 'new'},
      jest.fn(),
      jest.fn(),
    );
    expect(moi.root.findByProps({children: 'Mới'})).toBeTruthy();
  });

  it('cart press does not trigger the card press and vice versa', async () => {
    const onPress = jest.fn();
    const onAddToCart = jest.fn();
    const tree = await renderCard(baseProduct, onPress, onAddToCart);

    await renderer.act(async () => {
      tree.root.findByProps({testID: 'product-cart-p1'}).props.onPress();
    });
    expect(onAddToCart).toHaveBeenCalledTimes(1);
    expect(onPress).not.toHaveBeenCalled();

    await renderer.act(async () => {
      tree.root.findByProps({testID: 'product-card-p1'}).props.onPress();
    });
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onAddToCart).toHaveBeenCalledTimes(1);
  });
});
