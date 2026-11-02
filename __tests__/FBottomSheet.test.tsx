import 'react-native';
import React from 'react';
import {BackHandler} from 'react-native';
import renderer, {ReactTestRenderer} from 'react-test-renderer';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
  clear: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@gorhom/bottom-sheet', () => {
  const official = require('@gorhom/bottom-sheet/mock');
  return {
    ...official,
    BottomSheetBackdrop: () => null,
  };
});

import {ThemeProvider} from '@/core/theme';
import FBottomSheet, {FBottomSheetRef} from '@/shared/components/FBottomSheet';

const renderSheet = async (
  props?: Partial<React.ComponentProps<typeof FBottomSheet>>,
) => {
  const ref = React.createRef<FBottomSheetRef>();
  let tree!: ReactTestRenderer;
  await renderer.act(async () => {
    tree = renderer.create(
      <ThemeProvider>
        <FBottomSheet ref={ref} {...props}>
          {'sheet-body'}
        </FBottomSheet>
      </ThemeProvider>,
    );
  });
  return {tree, ref};
};

describe('FBottomSheet', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders children through the wrapper', async () => {
    const {tree} = await renderSheet();
    expect(tree.root.findByProps({children: 'sheet-body'})).toBeTruthy();
  });

  it('wraps children in BottomSheetView for dynamic sizing', async () => {
    const {BottomSheetView} = require('@gorhom/bottom-sheet');
    const {tree} = await renderSheet();
    expect(tree.root.findAllByType(BottomSheetView)).toHaveLength(1);
  });

  it('leaves children unwrapped when dynamic sizing is off', async () => {
    const {BottomSheetView} = require('@gorhom/bottom-sheet');
    const {tree} = await renderSheet({enableDynamicSizing: false});
    expect(tree.root.findAllByType(BottomSheetView)).toHaveLength(0);
  });

  it('exposes imperative ref methods', async () => {
    const {ref} = await renderSheet();
    expect(typeof ref.current?.present).toBe('function');
    expect(typeof ref.current?.dismiss).toBe('function');
  });

  it('registers no back handler while closed', async () => {
    const spy = jest.spyOn(BackHandler, 'addEventListener');
    await renderSheet();
    expect(spy).not.toHaveBeenCalled();
  });

  it('dismisses and handles Android back while open', async () => {
    const spy = jest.spyOn(BackHandler, 'addEventListener');
    const {ref} = await renderSheet();
    await renderer.act(async () => {
      (ref.current as any).props.onChange(0);
    });
    expect(spy).toHaveBeenCalledWith('hardwareBackPress', expect.any(Function));
    const dismiss = jest.spyOn(ref.current!, 'dismiss');
    const callback = spy.mock.calls[
      spy.mock.calls.length - 1
    ][1] as () => boolean;
    let handled = false;
    await renderer.act(async () => {
      handled = callback();
    });
    expect(handled).toBe(true);
    expect(dismiss).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when dismissed', async () => {
    const onClose = jest.fn();
    const {ref} = await renderSheet({onClose});
    await renderer.act(async () => {
      (ref.current as any).props.onDismiss();
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
