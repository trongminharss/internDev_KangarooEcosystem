import 'react-native';
import React from 'react';
import renderer, {ReactTestRenderer} from 'react-test-renderer';

let mockReduceMotion = false;
let mockAutostart: boolean | undefined;
let mockHookCalls = 0;
let mockSharedValues: Array<{value: number}> = [];
let mockFrameCb:
  | ((info: {timeSincePreviousFrame: number | null}) => void)
  | undefined;
let mockTimingTargets: number[] = [];

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
    // mockSharedValues[0] is `elapsed` (first useSharedValue call) — tests assert on it
    useSharedValue: (init: number) => {
      const sv = {value: init};
      mockSharedValues.push(sv);
      return sv;
    },
    useAnimatedProps: (updater: () => Record<string, unknown>) => updater(),
    useFrameCallback: (
      cb: (info: {timeSincePreviousFrame: number | null}) => void,
      autostart: boolean | undefined,
    ) => {
      mockHookCalls += 1;
      mockFrameCb = cb;
      mockAutostart = autostart;
      return {setActive: jest.fn(), isActive: autostart, callbackId: -1};
    },
    useReducedMotion: () => mockReduceMotion,
    withTiming: (target: number) => {
      mockTimingTargets.push(target);
      return target;
    },
    Easing: {out: (e: unknown) => e, cubic: 'cubic'},
  };
});

import {Circle, Path, Stop} from 'react-native-svg';

import {WaterWaveBubblesBackground} from '@/shared/components/WaterWaveBubblesBackground';

const renderWaves = async (props?: {height?: number; isDark?: boolean}) => {
  let tree!: ReactTestRenderer;
  await renderer.act(async () => {
    tree = renderer.create(<WaterWaveBubblesBackground {...props} />);
  });
  return tree;
};

describe('WaterWaveBubblesBackground', () => {
  beforeEach(() => {
    mockReduceMotion = false;
    mockAutostart = undefined;
    mockHookCalls = 0;
    mockFrameCb = undefined;
    mockTimingTargets = [];
    mockSharedValues = [];
  });

  it('renders two wave paths and five bubble circles', async () => {
    const tree = await renderWaves({height: 400});

    const back = tree.root
      .findAllByProps({fill: 'url(#waveGradBack)'})
      .filter(instance => instance.type === Path);
    const front = tree.root
      .findAllByProps({fill: 'url(#waveGradFront)'})
      .filter(instance => instance.type === Path);
    const bubbles = tree.root
      .findAllByProps({fill: 'url(#bubbleGrad)'})
      .filter(instance => instance.type === Circle);

    expect(back).toHaveLength(1);
    expect(front).toHaveLength(1);
    expect(bubbles).toHaveLength(5);
    expect(String(back[0].props.d)).toContain('L 0 400 Z');
    expect(String(front[0].props.d)).toContain('L 0 180 Z');
    // elapsed 0 → first bubble (offset 0) still below the screen, invisible
    expect(bubbles[0].props.cy).toBe(407);
    expect(bubbles[0].props.opacity).toBe(0);
    expect(mockAutostart).toBe(true);
  });

  it('reduce motion renders a static frame', async () => {
    mockReduceMotion = true;
    const tree = await renderWaves({height: 400});

    const bubbles = tree.root
      .findAllByProps({fill: 'url(#bubbleGrad)'})
      .filter(instance => instance.type === Circle);
    expect(bubbles).toHaveLength(5);
    expect(mockAutostart).toBe(false);

    await renderer.act(async () => {
      tree.update(<WaterWaveBubblesBackground height={600} />);
    });
    // reduced motion snaps directly, no withTiming tween
    expect(mockTimingTargets).toEqual([]);
  });

  it('tweens height prop changes through withTiming', async () => {
    const tree = await renderWaves({height: 400});
    expect(mockTimingTargets).toEqual([400]);

    await renderer.act(async () => {
      tree.update(<WaterWaveBubblesBackground height={600} />);
    });
    expect(mockTimingTargets).toEqual([400, 600]);
  });

  it('memo keeps the frame callback mounted across parent re-renders', async () => {
    const tree = await renderWaves();
    expect(mockHookCalls).toBe(1);

    await renderer.act(async () => {
      tree.update(<WaterWaveBubblesBackground />);
    });

    expect(mockHookCalls).toBe(1);
  });

  it('elapsed accumulates from frame deltas', async () => {
    await renderWaves();

    mockFrameCb?.({timeSincePreviousFrame: null});
    expect(mockSharedValues[0]?.value).toBe(0);

    mockFrameCb?.({timeSincePreviousFrame: 1750});
    expect(mockSharedValues[0]?.value).toBe(1750);

    mockFrameCb?.({timeSincePreviousFrame: 1750});
    expect(mockSharedValues[0]?.value).toBe(3500);
  });

  it('mounts at the previous screen level, then rises to the new height', async () => {
    // simulate PhoneLogin (0.4H) unmounting before Otp (0.6H) mounts
    await renderWaves({height: 400});

    const tree = await renderWaves({height: 600});
    const back = tree.root
      .findAllByProps({fill: 'url(#waveGradBack)'})
      .filter(instance => instance.type === Path);
    // fresh instance starts where the last screen left off, then tweens up
    expect(String(back[0].props.d)).toContain('L 0 400 Z');
    expect(mockTimingTargets).toEqual([400, 600]);
  });

  it('uses deeper blue palette when isDark is true', async () => {
    const lightTree = await renderWaves({isDark: false});
    const backGradLight = lightTree.root.findByProps({id: 'waveGradBack'});
    const frontGradLight = lightTree.root.findByProps({id: 'waveGradFront'});
    const backStopsLight = backGradLight.findAllByType(Stop);
    const frontStopsLight = frontGradLight.findAllByType(Stop);

    expect(backStopsLight[0].props.stopColor).toBe('#C1EDFF');
    expect(frontStopsLight[0].props.stopColor).toBe('#92DBFA');

    const darkTree = await renderWaves({isDark: true});
    const backGradDark = darkTree.root.findByProps({id: 'waveGradBack'});
    const frontGradDark = darkTree.root.findByProps({id: 'waveGradFront'});
    const backStopsDark = backGradDark.findAllByType(Stop);
    const frontStopsDark = frontGradDark.findAllByType(Stop);

    expect(backStopsDark[0].props.stopColor).toBe('#288BB5'); // colors.blue[700]
    expect(backStopsDark[1].props.stopColor).toBe('#18526B'); // colors.blue[900]
    expect(frontStopsDark[0].props.stopColor).toBe('#38C4FF'); // colors.blue[500]
  });
});
