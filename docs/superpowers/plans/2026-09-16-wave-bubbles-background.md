# Water Wave Bubbles Background Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `WaterWaveBubblesBackground` variant of the onboarding wave with 5 green glass bubbles rising from the bottom, swaying, and fading out near the wave surface, then swap it into `OnboardingScreen`.

**Architecture:** Copy of `WaterWaveBackground` (kept untouched as base) inside one `<Svg>`: two animated wave paths + 5 `AnimatedCircle` bubbles sharing one `<RadialGradient>` def. A single `useFrameCallback` accumulates `elapsed` (ms) into a shared value; wave phase and per-bubble progress are both derived from it inside worklets (`useAnimatedProps`) — no JS-bridge traffic per frame. Reduce Motion leaves a static staggered frame.

**Tech Stack:** react-native-svg, react-native-reanimated (both installed), react-test-renderer for tests.

**Spec:** `docs/superpowers/specs/2026-09-16-wave-bubbles-background-design.md`

---

## File Structure

| File                                                                                  | Action | Responsibility                                                      |
| ------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------- |
| `src/features/onboarding/presentation/components/WaterWaveBubblesBackground.tsx`      | Create | the wave + bubbles component (all math inside)                      |
| `src/features/onboarding/presentation/components/WaterWaveBubblesBackground.test.tsx` | Create | component tests (inline reanimated mock, copied from the base test) |
| `src/features/onboarding/presentation/screens/OnboardingScreen.tsx`                   | Modify | swap import + JSX to the new component                              |

No other files change. `WaterWaveBackground.tsx` and its test stay as-is.

---

### Task 1: WaterWaveBubblesBackground component (TDD)

**Files:**

- Create: `src/features/onboarding/presentation/components/WaterWaveBubblesBackground.test.tsx`
- Create: `src/features/onboarding/presentation/components/WaterWaveBubblesBackground.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/features/onboarding/presentation/components/WaterWaveBubblesBackground.test.tsx`:

```tsx
import 'react-native';
import React from 'react';
import renderer, {ReactTestRenderer} from 'react-test-renderer';

let mockReduceMotion = false;
let mockAutostart: boolean | undefined;
let mockHookCalls = 0;
let mockShared: {value: number} | undefined;
let mockFrameCb:
  | ((info: {timeSincePreviousFrame: number | null}) => void)
  | undefined;

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
    useSharedValue: (init: number) => {
      mockShared = {value: init};
      return mockShared;
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
  };
});

import {Circle, Path} from 'react-native-svg';

import {WaterWaveBubblesBackground} from './WaterWaveBubblesBackground';

const renderWaves = async (props?: {height: number}) => {
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
    mockShared = undefined;
    mockFrameCb = undefined;
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
    expect(mockShared?.value).toBe(0);

    mockFrameCb?.({timeSincePreviousFrame: 1750});
    expect(mockShared?.value).toBe(1750);

    mockFrameCb?.({timeSincePreviousFrame: 1750});
    expect(mockShared?.value).toBe(3500);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/features/onboarding/presentation/components/WaterWaveBubblesBackground.test.tsx`

Expected: FAIL — `Cannot find module './WaterWaveBubblesBackground'`.

- [ ] **Step 3: Write the component**

Create `src/features/onboarding/presentation/components/WaterWaveBubblesBackground.tsx`:

```tsx
import React from 'react';
import {Dimensions, StyleSheet} from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
} from 'react-native-reanimated';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const LOOP_DURATION = 7000;
const SEGMENTS = 8;

type WaveConfig = {
  baseY: number;
  amplitude: number;
  wavelength: number;
  fillHeight: number;
  speed: number;
  phaseOffset: number;
  gradientId: string;
  color: string;
};

type WaveShape = Omit<WaveConfig, 'fillHeight'>;

type BubbleConfig = {
  xFrac: number;
  r: number;
  duration: number;
  offset: number;
  wobble: number;
  wobbleFreq: number;
};

const {width: SCREEN_W, height: SCREEN_H} = Dimensions.get('window');

const BACK: WaveShape = {
  baseY: 30,
  amplitude: 16,
  wavelength: 420,
  speed: 1,
  phaseOffset: 0,
  gradientId: 'waveGradBack',
  color: '#C1EDFF',
};

const FRONT: WaveShape = {
  baseY: 22,
  amplitude: 14,
  wavelength: 380,
  speed: 2,
  phaseOffset: Math.PI / 3,
  gradientId: 'waveGradFront',
  color: '#A3E4FF',
};

// bubbles stop just under the front wave crest
const SURFACE_Y = FRONT.baseY + FRONT.amplitude;

const BUBBLES: BubbleConfig[] = [
  {xFrac: 0.12, r: 7, duration: 8000, offset: 0, wobble: 8, wobbleFreq: 1.5},
  {xFrac: 0.3, r: 13, duration: 6500, offset: 0.35, wobble: 12, wobbleFreq: 1},
  {xFrac: 0.5, r: 17, duration: 9000, offset: 0.7, wobble: 14, wobbleFreq: 2},
  {
    xFrac: 0.68,
    r: 9,
    duration: 7000,
    offset: 0.15,
    wobble: 10,
    wobbleFreq: 1.5,
  },
  {xFrac: 0.88, r: 11, duration: 10000, offset: 0.5, wobble: 11, wobbleFreq: 1},
];

const buildWavePath = (config: WaveConfig, phase: number, width: number) => {
  'worklet';
  const step = width / SEGMENTS;
  const yAt = (x: number) =>
    config.baseY +
    config.amplitude *
      Math.sin(
        (2 * Math.PI * x) / config.wavelength +
          phase * config.speed +
          config.phaseOffset,
      );
  let d = `M 0 ${yAt(0)}`;
  for (let i = 1; i <= SEGMENTS; i++) {
    const x0 = (i - 1) * step;
    const x1 = i * step;
    d += ` C ${x0 + step / 2} ${yAt(x0)} ${x1 - step / 2} ${yAt(
      x1,
    )} ${x1} ${yAt(x1)}`;
  }
  d += ` L ${width} ${config.fillHeight} L 0 ${config.fillHeight} Z`;
  return d;
};

const WaveGradient: React.FC<{config: WaveConfig}> = ({config}) => (
  <LinearGradient
    id={config.gradientId}
    gradientUnits="userSpaceOnUse"
    x1={0}
    y1={0}
    x2={0}
    y2={config.fillHeight}>
    <Stop offset="0" stopColor={config.color} stopOpacity="1" />
    <Stop offset="1" stopColor={config.color} stopOpacity="0" />
  </LinearGradient>
);

const BubbleGradient = () => (
  <RadialGradient id="bubbleGrad" cx="0.35" cy="0.3" r="0.9">
    <Stop offset="0" stopColor="#D5D5D5" stopOpacity="0.9" />
    <Stop offset="0.61" stopColor="#C2E2AF" stopOpacity="0.5" />
    <Stop offset="1" stopColor="#69C56A" stopOpacity="0.85" />
  </RadialGradient>
);

const bubbleProps = (bubble: BubbleConfig, elapsed: number, height: number) => {
  'worklet';
  const p = (elapsed / bubble.duration + bubble.offset) % 1;
  const startCy = height + bubble.r;
  const endCy = SURFACE_Y + bubble.r;
  return {
    cx:
      bubble.xFrac * SCREEN_W +
      bubble.wobble * Math.sin(2 * Math.PI * bubble.wobbleFreq * p),
    cy: startCy - (startCy - endCy) * p,
    // fade in over the first 10% of the rise, fade out over the last 25%
    opacity: Math.min(1, Math.min(p / 0.1, (1 - p) / 0.25)),
  };
};

type WaterWaveBubblesProps = {height?: number};

export const WaterWaveBubblesBackground = React.memo(function WaterWaveBubbles({
  height = SCREEN_H,
}: WaterWaveBubblesProps) {
  const elapsed = useSharedValue(0);
  const reduceMotion = useReducedMotion();
  const back: WaveConfig = {...BACK, fillHeight: height};
  const front: WaveConfig = {...FRONT, fillHeight: Math.round(height * 0.45)};

  useFrameCallback(info => {
    // accumulate frame deltas — the shared value survives re-renders and
    // callback re-registrations, so waves and bubbles never restart mid-scroll
    elapsed.value += info.timeSincePreviousFrame ?? 0;
  }, !reduceMotion);

  const wavePhase = () => (elapsed.value / LOOP_DURATION) * 2 * Math.PI;
  const backProps = useAnimatedProps(() => ({
    d: buildWavePath(back, wavePhase(), SCREEN_W),
  }));
  const frontProps = useAnimatedProps(() => ({
    d: buildWavePath(front, wavePhase(), SCREEN_W),
  }));
  const bubbleAnims = [
    useAnimatedProps(() => bubbleProps(BUBBLES[0], elapsed.value, height)),
    useAnimatedProps(() => bubbleProps(BUBBLES[1], elapsed.value, height)),
    useAnimatedProps(() => bubbleProps(BUBBLES[2], elapsed.value, height)),
    useAnimatedProps(() => bubbleProps(BUBBLES[3], elapsed.value, height)),
    useAnimatedProps(() => bubbleProps(BUBBLES[4], elapsed.value, height)),
  ];

  return (
    <Svg
      style={StyleSheet.absoluteFill}
      viewBox={`0 0 ${SCREEN_W} ${height}`}
      pointerEvents="none">
      <Defs>
        <WaveGradient config={back} />
        <WaveGradient config={front} />
        <BubbleGradient />
      </Defs>
      <AnimatedPath
        animatedProps={backProps}
        d={buildWavePath(back, 0, SCREEN_W)}
        fill={`url(#${back.gradientId})`}
      />
      <AnimatedPath
        animatedProps={frontProps}
        d={buildWavePath(front, 0, SCREEN_W)}
        fill={`url(#${front.gradientId})`}
      />
      {BUBBLES.map((bubble, i) => (
        <AnimatedCircle
          key={bubble.xFrac}
          animatedProps={bubbleAnims[i]}
          cx={bubble.xFrac * SCREEN_W}
          cy={height + bubble.r}
          r={bubble.r}
          fill="url(#bubbleGrad)"
        />
      ))}
    </Svg>
  );
});
```

Note: `wavePhase` is a plain function called inside worklets (not a hook) — it keeps the `(elapsed / LOOP_DURATION) * 2π` derivation in one place.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/features/onboarding/presentation/components/WaterWaveBubblesBackground.test.tsx`

Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/features/onboarding/presentation/components/WaterWaveBubblesBackground.test.tsx src/features/onboarding/presentation/components/WaterWaveBubblesBackground.tsx
git commit -m "feat(onboarding): add water wave background variant with rising bubbles"
```

---

### Task 2: Swap OnboardingScreen to the bubbles variant

**Files:**

- Modify: `src/features/onboarding/presentation/screens/OnboardingScreen.tsx:19` and `:70`

- [ ] **Step 1: Swap import and JSX**

In `src/features/onboarding/presentation/screens/OnboardingScreen.tsx`, replace line 19:

```tsx
import {WaterWaveBackground} from '../components/WaterWaveBackground';
```

with:

```tsx
import {WaterWaveBubblesBackground} from '../components/WaterWaveBubblesBackground';
```

and replace line 70:

```tsx
<WaterWaveBackground height={SCREEN_HEIGHT - 200} />
```

with:

```tsx
<WaterWaveBubblesBackground height={SCREEN_HEIGHT - 200} />
```

- [ ] **Step 2: Run the screen test to verify nothing broke**

Run: `npx jest src/features/onboarding`

Expected: PASS — the screen test mocks `react-native-reanimated` inline, and the new component uses the identical hook set as the base wave, so the existing mock covers it. If it fails because the screen test's mock lacks a hook, extend that mock (do not add a jest setup file).

- [ ] **Step 3: Run quality gates**

Run: `npx tsc --noEmit && npm test && npm run lint`

Expected: all clean.

- [ ] **Step 4: Commit**

```bash
git add src/features/onboarding/presentation/screens/OnboardingScreen.tsx
git commit -m "feat(onboarding): mount bubbles wave variant on onboarding screen"
```
