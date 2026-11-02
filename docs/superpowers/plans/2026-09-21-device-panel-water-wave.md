# Device Panel Water Wave Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static SVG backgrounds of `ConnectedDevicePanel` with the animated `WaterWaveBackground`, whose color follows a new `status` field on the device data.

**Architecture:** `WaterWaveBackground` learns to measure its own container via `onLayout` (fallback: `Dimensions`) so it renders correctly inside a card. The mock data model gains `status: WaveStatus`; the panel renders `<WaterWaveBackground status={data.status} />` as the card background.

**Tech Stack:** React Native 0.87, react-native-svg, Reanimated 4 (existing), react-test-renderer 19, jest 29.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-09-21-device-panel-water-wave-design.md`
- Package manager is **npm**, never yarn. Node >= 20.
- Tests live in root `__tests__/`, use the `@/` alias, assert with `react-test-renderer` (`renderer.create` + `renderer.act`). `@testing-library/react-native` is NOT installed.
- Reanimated + react-native-svg are already mocked inline in `__tests__/HomeSections.test.tsx` (lines 16-30, 69-85); `__tests__/WaterWaveBackground.test.tsx` mocks reanimated inline (lines 13-42) and uses real react-native-svg.
- Quality gates: every commit runs the pre-commit hook (check:arch → tsc → test → lint). Never bypass with `--no-verify`.
- Prettier: `arrowParens: 'avoid'`, `bracketSpacing: false`, `bracketSameLine: true`, `singleQuote: true`, `trailingComma: 'all'`.
- Import shared components and types from the `@/shared/components` barrel, not deep paths.
- Wave status colors (already in `WaterWaveBackground.tsx`): normal `#38C4FF`, warning `#F16623`, error `#ED1C24`.

---

### Task 1: WaterWaveBackground self-measuring container

**Files:**
- Modify: `src/shared/components/WaterWaveBackground.tsx`
- Test: `__tests__/WaterWaveBackground.test.tsx`

**Interfaces:**
- Consumes: existing `WaterWaveProps` (`height?`, `isDark?`, `status?`) — unchanged public API.
- Produces: same component, but `viewBox`/paths derive from measured layout instead of `SCREEN_W`/`height` prop. Full-screen callers unaffected (measured == screen). `WaveStatus` already exported from this file.

- [ ] **Step 1: Write the failing test**

In `__tests__/WaterWaveBackground.test.tsx`, inside `describe('WaterWaveBackground', ...)` after the `'uses deeper blue palette when isDark is true'` test, add:

```tsx
  it('measures its container and rebuilds paths from the layout', async () => {
    const tree = await renderWaves({height: 400});
    const svg = tree.root.findByProps({pointerEvents: 'none'});
    await renderer.act(async () => {
      svg.props.onLayout({nativeEvent: {layout: {width: 358, height: 170}}});
    });

    expect(String(svg.props.viewBox)).toBe('0 0 358 170');
    const back = tree.root
      .findAllByProps({fill: 'url(#waveGradBack)'})
      .filter(instance => instance.type === Path);
    expect(String(back[0].props.d)).toContain('L 358 170 L 0 170 Z');
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/WaterWaveBackground.test.tsx -t "measures its container"`
Expected: FAIL — `svg.props.onLayout is not a function` (no `onLayout` yet).

- [ ] **Step 3: Implement self-measuring**

In `src/shared/components/WaterWaveBackground.tsx`:

a) Change the React import and add the event type:

```tsx
import React, {useMemo, useState} from 'react';
import {
  Dimensions,
  StyleSheet,
  type LayoutChangeEvent,
} from 'react-native';
```

b) Inside the `WaterWave` component body, right after `const palette = ...`, add state and handler:

```tsx
  // falls back to screen size for the first paint, then trusts onLayout so the
  // wave fills any container (full screen or a card) without distortion
  const [layout, setLayout] = useState({w: SCREEN_W, h: height});

  const handleLayout = (event: LayoutChangeEvent) => {
    const {width, height} = event.nativeEvent.layout;
    setLayout(prev =>
      prev.w === width && prev.h === height ? prev : {w: width, h: height},
    );
  };
```

c) Replace every `height` / `SCREEN_W` usage in the component body:

```tsx
  const back: WaveConfig = useMemo(
    () => ({
      ...BACK_LIGHT,
      fillHeight: layout.h,
      color: palette.back,
      endColor: palette.backEnd,
      endOpacity: 1,
    }),
    [layout, palette],
  );

  const front: WaveConfig = useMemo(
    () => ({
      ...FRONT_LIGHT,
      fillHeight: Math.round(layout.h * 0.45),
      color: palette.front,
      endColor: palette.front,
      endOpacity: 0,
    }),
    [layout, palette],
  );
```

```tsx
  const backProps = useAnimatedProps(() => ({
    d: buildWavePath(back, phase.value, layout.w),
  }));
  const frontProps = useAnimatedProps(() => ({
    d: buildWavePath(front, phase.value, layout.w),
  }));

  return (
    <Svg
      style={StyleSheet.absoluteFill}
      onLayout={handleLayout}
      viewBox={`0 0 ${layout.w} ${layout.h}`}
      pointerEvents="none">
      <Defs>
        <Gradient config={back} />
        <Gradient config={front} />
      </Defs>
      <AnimatedPath
        animatedProps={backProps}
        d={buildWavePath(back, 0, layout.w)}
        fill={`url(#${back.gradientId})`}
      />
      <AnimatedPath
        animatedProps={frontProps}
        d={buildWavePath(front, 0, layout.w)}
        fill={`url(#${front.gradientId})`}
      />
    </Svg>
  );
```

- [ ] **Step 4: Run the whole suite to verify it passes**

Run: `npx jest __tests__/WaterWaveBackground.test.tsx`
Expected: PASS — 7 tests (6 existing + 1 new). The existing `'reduce motion renders static paths'` test still asserts `L 0 400 Z` because no `onLayout` fires there.

- [ ] **Step 5: Commit**

```bash
git add src/shared/components/WaterWaveBackground.tsx __tests__/WaterWaveBackground.test.tsx
git commit -m "feat(ui): size water wave background from its container"
```

---

### Task 2: status field on connected device mock data

**Files:**
- Modify: `src/features/home/presentation/mocks/mockHome.ts`
- Modify: `src/shared/components/index.ts`
- Test: `__tests__/mockHome.test.ts`

**Interfaces:**
- Consumes: `WaveStatus` type (Task 1, exported from `WaterWaveBackground.tsx`).
- Produces: `ConnectedDeviceData.status: WaveStatus` (required); `MOCK_CONNECTED.status === 'normal'`; barrel re-exports the type: `export type {WaveStatus} from './WaterWaveBackground';`

- [ ] **Step 1: Write the failing test**

In `__tests__/mockHome.test.ts`, extend `'MOCK_CONNECTED mirrors the design numbers and carries devices'` — add after the `qualityLabel` assertion:

```ts
    expect(MOCK_CONNECTED.status).toBe('normal');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/mockHome.test.ts`
Expected: FAIL — `Expected: "normal", Received: undefined`.

- [ ] **Step 3: Implement the field and barrel export**

In `src/shared/components/index.ts`, append:

```ts
export type {WaveStatus} from './WaterWaveBackground';
```

In `src/features/home/presentation/mocks/mockHome.ts`, add the import next to the existing ones:

```ts
import type {WaveStatus} from '@/shared/components';
```

Extend the interface (after the `devices` field):

```ts
export interface ConnectedDeviceData {
  grade: string;
  gradePpm: string;
  qualityLabel: string;
  stats: {efficiency: string; filtered: string; inputPpm: string};
  devices: MockDevice[];
  status: WaveStatus;
}
```

Add to `MOCK_CONNECTED`:

```ts
export const MOCK_CONNECTED: ConnectedDeviceData = {
  grade: 'A+',
  gradePpm: '3.2',
  qualityLabel: 'Tuyệt vời',
  stats: {efficiency: '85%', filtered: 'A+', inputPpm: '214'},
  devices: [
    {id: 'd1', room: 'Phòng khách', name: 'Máy lọc nước', statusText: 'Tốt'},
    {id: 'd2', room: 'Phòng khách', name: 'Máy lọc nước', statusText: 'Tốt'},
  ],
  status: 'normal',
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/mockHome.test.ts`
Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/features/home/presentation/mocks/mockHome.ts src/shared/components/index.ts __tests__/mockHome.test.ts
git commit -m "feat(home): add status field to connected device mock"
```

---

### Task 3: Swap ConnectedDevicePanel backgrounds for the animated wave

**Files:**
- Modify: `src/features/home/presentation/components/ConnectedDevicePanel.tsx`
- Test: `__tests__/HomeSections.test.tsx`

**Interfaces:**
- Consumes: `<WaterWaveBackground status={...} />` (Task 1) and `ConnectedDeviceData.status` (Task 2).
- Produces: panel renders `WaterWaveBackground` as its only background; test-visible via `findByProps({status: ...})` on the wave instance.

- [ ] **Step 1: Write the failing test**

In `__tests__/HomeSections.test.tsx`, inside `describe('ConnectedDevicePanel', ...)`, add:

```tsx
  it('renders the animated wave background with the device status', async () => {
    const tree = await render(<ConnectedDevicePanel data={MOCK_CONNECTED} />);
    expect(tree.root.findByProps({status: 'normal'})).toBeTruthy();

    const warning = {...MOCK_CONNECTED, status: 'warning' as const};
    const warningTree = await render(
      <ConnectedDevicePanel data={warning} />,
    );
    expect(warningTree.root.findByProps({status: 'warning'})).toBeTruthy();
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/HomeSections.test.tsx -t "animated wave background"`
Expected: FAIL — `No instances found with props: {"status": "normal"}`.

- [ ] **Step 3: Swap the backgrounds**

In `src/features/home/presentation/components/ConnectedDevicePanel.tsx`:

a) Replace the imports — remove `react-native-svg` entirely, add `WaterWaveBackground` to the shared barrel import:

```tsx
import React from 'react';
import {StyleSheet, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {ColorsProps, useTheme} from '@/core/theme';
import {FText, WaterWaveBackground} from '@/shared/components';
import {tokens} from '@/shared/styles';
import {ConnectedDeviceData} from '@/features/home/presentation/mocks/mockHome';
```

b) Replace the whole background block inside `styles.card` — the `{isDark ? (<Svg ...>...</Svg>) : (<Svg ...>...</Svg>)}` conditional — with a single line:

```tsx
        <View style={styles.card}>
          <WaterWaveBackground status={data.status} />
          <View style={styles.cardContent}>
```

Everything from `<View style={styles.cardContent}>` to the end of the component stays untouched. `isDark` stays destructured from `useTheme()` — text colors and `statPillDark` still use it.

- [ ] **Step 4: Run the suite to verify it passes**

Run: `npx jest __tests__/HomeSections.test.tsx`
Expected: PASS — the new test plus all existing `ConnectedDevicePanel`, `DeviceSection`, `DeviceGridHeader`, `DeviceCard`, `ProductSection` tests (the inline svg/reanimated mocks already cover the wave component).

- [ ] **Step 5: Commit**

```bash
git add src/features/home/presentation/components/ConnectedDevicePanel.tsx __tests__/HomeSections.test.tsx
git commit -m "feat(home): animate device panel background with water wave"
```

---

## Out of scope (from spec)

- Real device-status data (thunks/API) — mocks stay until the data layer lands.
- `DeviceCard` grid items and full-screen `WaterWaveBackground` callers keep current behavior.
