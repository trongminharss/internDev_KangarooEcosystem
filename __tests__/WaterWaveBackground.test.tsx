import 'react-native';
import React from 'react';
import renderer, {ReactTestRenderer} from 'react-test-renderer';

let mockReduceMotion = false;

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
    useSharedValue: (init: number) => {
      mockSharedValues.push({value: init});
      return mockSharedValues[mockSharedValues.length - 1];
    },
    useAnimatedStyle: (updater: () => Record<string, unknown>) => updater(),
    useReducedMotion: () => mockReduceMotion,
  };
});

const mockSharedValues: {value: number}[] = [];

import {Path, Stop} from 'react-native-svg';

import {
  WaterWaveBackground,
  waveBackgroundColor,
} from '@/shared/components/WaterWaveBackground';

const renderWaves = async (props?: {
  height?: number;
  isDark?: boolean;
  status?: 'normal' | 'warning' | 'error';
  waterLevel?: number;
}) => {
  let tree!: ReactTestRenderer;
  await renderer.act(async () => {
    tree = renderer.create(<WaterWaveBackground {...props} />);
  });
  return tree;
};

describe('WaterWaveBackground', () => {
  beforeEach(() => {
    mockReduceMotion = false;
    mockSharedValues.length = 0;
  });

  it('renders two static periodic wave paths', async () => {
    const tree = await renderWaves();

    const back = tree.root
      .findAllByProps({fill: 'url(#waveGradBack)'})
      .filter(instance => instance.type === Path);
    const front = tree.root
      .findAllByProps({fill: 'url(#waveGradFront)'})
      .filter(instance => instance.type === Path);

    expect(back).toHaveLength(1);
    expect(front).toHaveLength(1);
    expect(String(back[0].props.d)).toMatch(/^M 0 -?\d/);
    expect(String(back[0].props.d)).toContain('Z');
    expect(String(front[0].props.d)).toMatch(/^M 0 -?\d/);
    expect(String(front[0].props.d)).toContain('Z');
  });

  it('reduce motion leaves the waves static', async () => {
    mockReduceMotion = true;
    const tree = await renderWaves({height: 400});

    const back = tree.root
      .findAllByProps({fill: 'url(#waveGradBack)'})
      .filter(instance => instance.type === Path);
    const front = tree.root
      .findAllByProps({fill: 'url(#waveGradFront)'})
      .filter(instance => instance.type === Path);
    expect(back).toHaveLength(1);
    expect(front).toHaveLength(1);
    expect(String(back[0].props.d)).toContain('L 0 400 Z');
    expect(String(front[0].props.d)).toContain('L 0 180 Z');
    // no animation was started
    expect(mockSharedValues.map(sv => sv.value)).not.toContain(-420);
  });

  it('loops each wave by exactly one wavelength (front at 2× speed)', async () => {
    await renderWaves({height: 400});

    const values = mockSharedValues.map(sv => sv.value);
    expect(values).toContain(-420); // back: one wavelength per loop
    expect(values).toContain(-380); // front: one wavelength per loop
  });

  it('waterLevel prop anchors the surface at the given fraction', async () => {
    const tree = await renderWaves({height: 400, waterLevel: 0.7});

    const front = tree.root
      .findAllByProps({fill: 'url(#waveGradFront)'})
      .filter(instance => instance.type === Path);
    // fills to the bottom once the level is set
    expect(String(front[0].props.d)).toContain('L 0 400 Z');
    // surface sits at exactly 0.7 * 400 = 280
    expect(String(front[0].props.d)).toMatch(/^M 0 280 /);

    // without the prop the reference geometry applies untouched
    const plain = await renderWaves({height: 400});
    const plainFront = plain.root
      .findAllByProps({fill: 'url(#waveGradFront)'})
      .filter(instance => instance.type === Path);
    expect(String(plainFront[0].props.d)).toContain('L 0 180 Z');
    expect(String(plainFront[0].props.d)).toMatch(/^M 0 22 /);
  });

  it('uses deeper blue palette when isDark is true', async () => {
    const lightTree = await renderWaves({isDark: false});
    const backGradLight = lightTree.root.findByProps({id: 'waveGradBack'});
    const frontGradLight = lightTree.root.findByProps({id: 'waveGradFront'});
    const backStopsLight = backGradLight.findAllByType(Stop);
    const frontStopsLight = frontGradLight.findAllByType(Stop);

    expect(backStopsLight[0].props.stopColor).toBe('#C1EDFF');
    expect(frontStopsLight[0].props.stopColor).toBe('#38C4FF');

    const darkTree = await renderWaves({isDark: true});
    const backGradDark = darkTree.root.findByProps({id: 'waveGradBack'});
    const frontGradDark = darkTree.root.findByProps({id: 'waveGradFront'});
    const backStopsDark = backGradDark.findAllByType(Stop);
    const frontStopsDark = frontGradDark.findAllByType(Stop);

    expect(backStopsDark[0].props.stopColor).toBe('#288BB5'); // colors.blue[700]
    expect(backStopsDark[1].props.stopColor).toBe('#18526B'); // colors.blue[900]
    expect(frontStopsDark[0].props.stopColor).toBe('#38C4FF'); // colors.blue[500]
  });

  it('measures its container and rebuilds paths from the layout', async () => {
    const tree = await renderWaves({height: 400});
    const container = tree.root.findByProps({pointerEvents: 'none'});
    await renderer.act(async () => {
      container.props.onLayout({
        nativeEvent: {layout: {width: 358, height: 170}},
      });
    });

    // path spans the container rounded up to whole wavelengths (2 × 420 = 840)
    const back = tree.root
      .findAllByProps({fill: 'url(#waveGradBack)'})
      .filter(instance => instance.type === Path);
    expect(String(back[0].props.d)).toContain('L 840 170 L 0 170 Z');
  });

  it('status prop switches the wave palette', async () => {
    const frontColor = async (status?: 'normal' | 'warning' | 'error') => {
      const tree = await renderWaves({status});
      const grad = tree.root.findByProps({id: 'waveGradFront'});
      return grad.findAllByType(Stop)[0].props.stopColor as string;
    };

    expect(await frontColor('normal')).toBe('#38C4FF');
    expect(await frontColor('warning')).toBe('#F16623');
    expect(await frontColor('error')).toBe('#ED1C24');
  });
});

describe('waveBackgroundColor', () => {
  it('returns the status base color per theme', () => {
    expect(waveBackgroundColor('normal', false)).toBe('#C1EDFF');
    expect(waveBackgroundColor('warning', false)).toBe('#FDDAC8');
    expect(waveBackgroundColor('error', false)).toBe('#FBC5C7');
    expect(waveBackgroundColor('normal', true)).toBe('#288BB5'); // blue[700]
    expect(waveBackgroundColor('warning', true)).toBe('#B84A16');
    expect(waveBackgroundColor('error', true)).toBe('#B2141B');
  });
});
