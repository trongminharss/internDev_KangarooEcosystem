jest.mock('@gorhom/bottom-sheet', () => require('@gorhom/bottom-sheet/mock'));

import '@/core/i18n';
import React from 'react';
import renderer, {ReactTestRenderer} from 'react-test-renderer';

import {FSnackbarProvider} from '@/shared/hooks/useSnackbar';
import {FBottomSheetRef} from '@/shared/components';
import {FilterSection} from '@/features/device/presentation/components/FilterSection';
import {SettingsSheet} from '@/features/device/presentation/components/SettingsSheet';
import {PURIFIER_MOCK} from '@/features/device/presentation/purifierMock';

jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);

jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: ({children}: any) => children,
  TouchableWithoutFeedback: ({children}: any) => children,
}));

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

jest.mock('react-native-modal', () => {
  const {createElement} = require('react');
  const MockModal = ({children}: any) => createElement('View', null, children);
  MockModal.default = MockModal;
  return MockModal;
});

const gorhom = jest.requireMock('@gorhom/bottom-sheet');
const MockModal = gorhom.BottomSheetModal;
const presentSpy = jest.spyOn(MockModal.prototype, 'present');

const sheetProps = (tree: ReactTestRenderer) =>
  tree.root.findByType(MockModal).props as Record<string, any>;

const renderUI = async (ui: React.ReactElement) => {
  let tree!: ReactTestRenderer;
  await renderer.act(async () => {
    tree = renderer.create(ui);
  });
  return tree;
};

describe('PurifierDetail sheets present on press', () => {
  // cartridge fill-up animation schedules native-driven timers
  beforeEach(() => {
    jest.useFakeTimers();
    presentSpy.mockClear();
  });
  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('presents the filter detail sheet with a fixed detent on cartridge press', async () => {
    const tree = await renderUI(
      <FilterSection
        filters={PURIFIER_MOCK.filters}
        onBuy={jest.fn()}
        onReplace={jest.fn()}
      />,
    );

    expect(presentSpy).not.toHaveBeenCalled();
    expect(sheetProps(tree).enableDynamicSizing).toBe(false);

    // Pressable is memo-wrapped — match by props, not component type
    const cartridge = tree.root
      .findAllByProps({accessibilityRole: 'button'})
      .find(p => String(p.props.accessibilityLabel ?? '').includes('PP5'));
    await renderer.act(async () => cartridge!.props.onPress());

    expect(presentSpy).toHaveBeenCalledTimes(1);
    expect(sheetProps(tree).snapPoints).toEqual(['60%']);
  });

  it('presents the settings sheet imperatively via ref, FAppbar style', async () => {
    const sheetRef = React.createRef<FBottomSheetRef>();
    const tree = await renderUI(
      <FSnackbarProvider>
        <SettingsSheet
          ref={sheetRef}
          device={PURIFIER_MOCK}
          onRename={jest.fn()}
          onRelocate={jest.fn()}
          onDeleted={jest.fn()}
        />
      </FSnackbarProvider>,
    );

    expect(presentSpy).not.toHaveBeenCalled();

    await renderer.act(async () => {
      sheetRef.current!.present();
    });

    expect(presentSpy).toHaveBeenCalledTimes(1);
    const props = sheetProps(tree);
    expect(props.enableDynamicSizing).toBe(false);
    expect(props.snapPoints).toEqual(['40%']);
  });
});
