# Onboarding Water Wave Background Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Animated two-layer water-wave background on the onboarding screen, matching the reference SVG (`#C1EDFF` back layer to screen bottom, `#A3E4FF` front layer to ~45% height), drifting continuously on the UI thread.

**Architecture:** Feature-local presentation component `WaterWaveBackground` (react-native-svg shapes + two static `LinearGradient`s) whose wave `d` paths are rebuilt every frame inside Reanimated worklets (`useAnimatedProps`), driven by one looping shared phase value. Reduce Motion renders a static frame.

**Tech Stack:** react-native-svg 15 (installed), react-native-reanimated 4.6 + react-native-worklets 0.12 (new), RN core `Animated` usage in the screen stays untouched.

**Spec:** `docs/superpowers/specs/2026-09-15-onboarding-water-wave-background-design.md`

---

## File Structure

| File                                                                           | Action      | Responsibility                                                          |
| ------------------------------------------------------------------------------ | ----------- | ----------------------------------------------------------------------- |
| `package.json` / lockfile                                                      | npm install | adds reanimated + worklets                                              |
| `babel.config.js`                                                              | Modify      | add `react-native-worklets/plugin` (must be LAST plugin)                |
| `jest.config.js`                                                               | Modify      | extend the existing `transformIgnorePatterns` whitelist group           |
| `src/features/onboarding/presentation/components/WaterWaveBackground.tsx`      | Create      | the wave component (all wave math inside)                               |
| `src/features/onboarding/presentation/components/WaterWaveBackground.test.tsx` | Create      | component tests (inline reanimated mock)                                |
| `src/features/onboarding/presentation/screens/OnboardingScreen.tsx`            | Modify      | mount the background under the ScrollView                               |
| `src/features/onboarding/presentation/screens/OnboardingScreen.test.tsx`       | Modify      | add the inline reanimated mock to its mock block                        |
| `README.md`, `CLAUDE.md`                                                       | Modify      | stack mention (rule: update both with same commit as convention change) |

Note: `AGENTS.md` is a symlink to `CLAUDE.md` — edit `CLAUDE.md` only.

---

### Task 1: Install Reanimated and wire tooling

**Files:**

- Modify: `babel.config.js`
- Modify: `jest.config.js:6-8`
- Modify: `README.md:4`
- Modify: `CLAUDE.md` (Project Overview stack line)
- Create: none

- [ ] **Step 1: Install the packages**

The repo has `.npmrc` with `legacy-peer-deps=true`; use npm.

```bash
npm install react-native-reanimated@^4.6.0 react-native-worklets@^0.12.0
```

Expected: installs cleanly, `postinstall` (patch-package) runs, no peer errors.

- [ ] **Step 2: iOS pods (Bundler-managed — never bare `pod install`)**

```bash
cd ios && bundle exec pod install
```

Expected: `ReactNativeReanimated` / `ReactNativeWorklets` pods install. (Android picks them up via autolinking on next build; `minSdkVersion = 24` already satisfies Reanimated 4.)

- [ ] **Step 3: Add the babel plugin — LAST in the plugins array**

The worklets plugin must be the final plugin or it silently does nothing.

```js
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@': './src',
        },
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
      },
    ],
    'react-native-worklets/plugin',
  ],
};
```

- [ ] **Step 4: Extend the jest whitelist group**

Add `react-native-worklets` and `react-native-reanimated` to the SAME group (never a second entry):

```js
module.exports = {
  preset: '@react-native/jest-preset',
  moduleNameMapper: {
    '\\.svg$': '<rootDir>/__mocks__/svgMock.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|immer|@reduxjs/toolkit|@react-native-async-storage|react-redux|@react-navigation|react-native-worklets|react-native-reanimated)/)',
  ],
};
```

- [ ] **Step 5: Update stack docs**

`README.md` line 4, replace:

```markdown
> Stack: **React Native + TypeScript + Redux Toolkit + Axios + React Navigation**.
```

with:

```markdown
> Stack: **React Native + TypeScript + Redux Toolkit + Axios + React Navigation + Reanimated**.
```

`CLAUDE.md` Project Overview, replace the line:

```markdown
React Native 0.87 + TypeScript app built with Clean Architecture + Vertical Feature Slicing.
Stack: Redux Toolkit, Axios, React Navigation 7, react-native-paper 5, i18next, Firebase (messaging + notifee).
```

with:

```markdown
React Native 0.87 + TypeScript app built with Clean Architecture + Vertical Feature Slicing.
Stack: Redux Toolkit, Axios, React Navigation 7, react-native-paper 5, i18next, Reanimated 4, Firebase (messaging + notifee).
```

- [ ] **Step 6: Verify baseline is still green**

```bash
npx tsc --noEmit && npm test && npm run lint
```

Expected: all pass (nothing uses reanimated yet).

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json babel.config.js jest.config.js README.md CLAUDE.md
git commit -m "chore: add reanimated 4 with worklets babel plugin"
```

---

### Task 2: WaterWaveBackground component (TDD)

**Files:**

- Create: `src/features/onboarding/presentation/components/WaterWaveBackground.test.tsx`
- Create: `src/features/onboarding/presentation/components/WaterWaveBackground.tsx`

- [ ] **Step 1: Write the failing test**

Repo convention: every mock is inline `jest.mock()` (no jest setup file). The reanimated mock runs the `useAnimatedProps` updater synchronously once and merges `animatedProps` into the wrapped element, so real path strings are asserted.

```tsx
import 'react-native';
import React from 'react';
import renderer, {ReactTestRenderer} from 'react-test-renderer';

let mockReduceMotion = false;

jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const identity = (x: unknown) => x;
  const createAnimatedComponent = (Comp: unknown) => (props: any) =>
    React.createElement(Comp, {
      ...props,
      ...(typeof props.animatedProps === 'object' ? props.animatedProps : null),
    });
  return {
    __esModule: true,
    default: {createAnimatedComponent},
    createAnimatedComponent,
    useSharedValue: (init: number) => ({value: init}),
    useAnimatedProps: (updater: () => Record<string, unknown>) => updater(),
    withTiming: (toValue: number) => ({toValue}),
    withRepeat: (animation: unknown) => ({animation}),
    cancelAnimation: jest.fn(),
    Easing: {linear: identity},
    useReducedMotion: () => mockReduceMotion,
  };
});

import {WaterWaveBackground} from './WaterWaveBackground';

const renderWaves = async () => {
  let tree!: ReactTestRenderer;
  await renderer.act(async () => {
    tree = renderer.create(<WaterWaveBackground />);
  });
  return tree;
};

describe('WaterWaveBackground', () => {
  beforeEach(() => {
    mockReduceMotion = false;
  });

  it('renders two wave paths with the reference gradients', async () => {
    const tree = await renderWaves();

    const back = tree.root.findAllByProps({fill: 'url(#waveGradBack)'});
    const front = tree.root.findAllByProps({fill: 'url(#waveGradFront)'});

    expect(back).toHaveLength(1);
    expect(front).toHaveLength(1);
    expect(String(back[0].props.d)).toMatch(/^M 0 -?\d/);
    expect(String(back[0].props.d)).toContain('Z');
    expect(String(front[0].props.d)).toMatch(/^M 0 -?\d/);
    expect(String(front[0].props.d)).toContain('Z');
  });

  it('reduce motion renders static paths', async () => {
    mockReduceMotion = true;
    const tree = await renderWaves();

    expect(tree.root.findAllByProps({fill: 'url(#waveGradBack)'})).toHaveLength(
      1,
    );
    expect(
      tree.root.findAllByProps({fill: 'url(#waveGradFront)'}),
    ).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/features/onboarding/presentation/components/WaterWaveBackground.test.tsx
```

Expected: FAIL — `Cannot find module './WaterWaveBackground'`.

- [ ] **Step 3: Write the component**

Wave math: sine surface sampled at 8 points, joined by smooth cubics (control points offset half a step horizontally), closed down to the layer's fill depth. One `buildWavePath` marked `'worklet'` — worklets are also callable from the JS thread, so the same function renders the static reduce-motion frame. Gradients use `gradientUnits="userSpaceOnUse"` with an absolute `y2` so they don't shift as the morphing path's bounding box moves.

```tsx
import React, {useEffect} from 'react';
import {Dimensions, StyleSheet} from 'react-native';
import Svg, {Defs, LinearGradient, Path, Stop} from 'react-native-svg';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const LOOP_DURATION = 9000;
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

const {width: SCREEN_W, height: SCREEN_H} = Dimensions.get('window');

const BACK: WaveConfig = {
  baseY: 30,
  amplitude: 16,
  wavelength: 420,
  fillHeight: SCREEN_H,
  speed: 1,
  phaseOffset: 0,
  gradientId: 'waveGradBack',
  color: '#C1EDFF',
};

const FRONT: WaveConfig = {
  baseY: 22,
  amplitude: 14,
  wavelength: 380,
  fillHeight: Math.round(SCREEN_H * 0.45),
  speed: 9 / 7,
  phaseOffset: Math.PI / 3,
  gradientId: 'waveGradFront',
  color: '#A3E4FF',
};

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

const Gradient: React.FC<{config: WaveConfig}> = ({config}) => (
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

export const WaterWaveBackground: React.FC = () => {
  const phase = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      return;
    }
    phase.value = withRepeat(
      withTiming(2 * Math.PI, {duration: LOOP_DURATION, easing: Easing.linear}),
      -1,
      false,
    );
    return () => cancelAnimation(phase);
  }, [phase, reduceMotion]);

  const backProps = useAnimatedProps(() => ({
    d: buildWavePath(BACK, phase.value, SCREEN_W),
  }));
  const frontProps = useAnimatedProps(() => ({
    d: buildWavePath(FRONT, phase.value, SCREEN_W),
  }));

  return (
    <Svg
      style={StyleSheet.absoluteFill}
      viewBox={`0 0 ${SCREEN_W} ${SCREEN_H}`}
      pointerEvents="none">
      <Defs>
        <Gradient config={BACK} />
        <Gradient config={FRONT} />
      </Defs>
      <AnimatedPath
        animatedProps={backProps}
        d={buildWavePath(BACK, 0, SCREEN_W)}
        fill={`url(#${BACK.gradientId})`}
      />
      <AnimatedPath
        animatedProps={frontProps}
        d={buildWavePath(FRONT, 0, SCREEN_W)}
        fill={`url(#${FRONT.gradientId})`}
      />
    </Svg>
  );
};
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest src/features/onboarding/presentation/components/WaterWaveBackground.test.tsx
```

Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/onboarding/presentation/components/WaterWaveBackground.test.tsx src/features/onboarding/presentation/components/WaterWaveBackground.tsx
git commit -m "feat: add water wave background component"
```

---

### Task 3: Mount in OnboardingScreen

**Files:**

- Modify: `src/features/onboarding/presentation/screens/OnboardingScreen.tsx`
- Modify: `src/features/onboarding/presentation/screens/OnboardingScreen.test.tsx`

- [ ] **Step 1: Extend the screen test mock block first (TDD for the mount)**

Add the same inline reanimated mock (verbatim from Task 2 Step 1, including the `mockReduceMotion` declaration) right after the `rn-tooltip` mock block in `OnboardingScreen.test.tsx`. Update the first test to also assert the background is mounted:

In `it('renders 3 slides...')`, after the dot assertions, add:

```tsx
expect(tree.root.findAllByProps({fill: 'url(#waveGradBack)'})).toHaveLength(1);
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/features/onboarding/presentation/screens/OnboardingScreen.test.tsx
```

Expected: FAIL — `findAllByProps({fill: 'url(#waveGradBack)'})` finds nothing (background not mounted yet).

- [ ] **Step 3: Mount the background**

In `OnboardingScreen.tsx`, add the import next to the other feature-relative imports:

```tsx
import {WaterWaveBackground} from '../components/WaterWaveBackground';
```

(Note: this stays a relative import because it is intra-feature — everything else uses `@/`.)

Render it inside `styles.container`, before the `ScrollView`, so it sits underneath:

```tsx
  return (
    <View style={styles.container}>
      <WaterWaveBackground />
      <ScrollView
```

Nothing else changes — `pointerEvents="none"` is on the `<Svg>` itself.

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest src/features/onboarding/presentation/screens/OnboardingScreen.test.tsx
```

Expected: PASS (3 tests).

- [ ] **Step 5: Quality gates**

```bash
npx tsc --noEmit && npm test && npm run lint
```

Expected: all green.

- [ ] **Step 6: Visual check on device/simulator**

```bash
npm run ios
```

Expected: onboarding shows two soft blue wave bands rippling near the top (back one fading to nothing at screen bottom, front one at ~45% height), drifting at slightly different speeds, logo/title floating above. Check Reduce Motion (iOS Settings → Accessibility) renders a static frame.

- [ ] **Step 7: Commit**

```bash
git add src/features/onboarding/presentation/screens/OnboardingScreen.tsx src/features/onboarding/presentation/screens/OnboardingScreen.test.tsx
git commit -m "feat: mount water wave background in onboarding"
```

---

## Self-Review

**Spec coverage:** placement under ScrollView + pointerEvents none (Task 3) ✓; svg gradients per layer with exact colors/fill depths (Task 2) ✓; single shared phase, front derives `phase * 9/7 + offset` via `speed`/`phaseOffset` (Task 2 `FRONT.speed = 9/7`) ✓; worklet-only per-frame path building (Task 2) ✓; `cancelAnimation` on unmount (Task 2 useEffect cleanup) ✓; Reduce Motion static frame (Task 2 + test) ✓; blur skipped, colors fixed constants ✓; tests colocated with inline mocks, no jest setup file (Tasks 2–3) ✓; transformIgnorePatterns extended in the same group (Task 1) ✓; docs updated per repo rule (Task 1) ✓.

**Placeholder scan:** none — every code step contains complete code, every run step has expected output.

**Type consistency:** `WaveConfig` fields (`baseY, amplitude, wavelength, fillHeight, speed, phaseOffset, gradientId, color`) match between config objects, `buildWavePath`, and `Gradient` usage; gradient ids `waveGradBack`/`waveGradFront` match between component and both test files.

**Addendum (post-final-review):** `FRONT.speed` shipped as `2`, not `9/7` — see the spec's motion section for why non-integer ratios snap under a resetting `withRepeat` loop.
