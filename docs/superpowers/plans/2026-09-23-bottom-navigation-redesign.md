# Bottom Navigation Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thay default bottom tab bar bằng custom tabBar có capsule highlight trượt/giãn khi tap và hold-220ms-drag preview khi giữ-kéo-thả, đúng đặc tả motion.

**Architecture:** Custom `tabBar` cho `@react-navigation/bottom-tabs` v7. Một bộ điều phối gesture duy nhất (Tap + LongPress qua `Gesture.Exclusive`). Capsule là Reanimated shared values trên UI thread (2 cạnh spring độc lập); `state.index` là nguồn chân lý duy nhất cho selected. Điều hướng chỉ gọi tại 1 hàm JS (`commitSelection`) qua `runOnJS` lúc commit.

**Tech Stack:** React Navigation bottom-tabs 7.3, Reanimated 4.6 (New Arch + worklets), Gesture Handler 3.2, safe-area-context, react-native-haptic-feedback (mới).

**Design doc:** `docs/superpowers/specs/2026-09-23-bottom-navigation-redesign-design.md`
**Motion spec — chuẩn nghiệm thu NAV-01→20:** `docs/superpowers/specs/2026-09-23-bottom-navigation-motion-spec.md`

## Global Constraints

- Package manager: **npm** (`.npmrc` đã có `legacy-peer-deps=true`). Không yarn. Node >= 20.
- iOS pods: `cd ios && bundle exec pod install` (Bundler-managed).
- Quality gates mỗi task: `npx tsc --noEmit`, `npm test`, `npm run lint`; feature check: `npm run check:arch`.
- Prettier: `arrowParens: 'avoid'`, `bracketSpacing: false`, `bracketSameLine: true`, `singleQuote: true`, `trailingComma: 'all'`.
- Import qua alias `@/`; chỉ asset `require()` dùng relative.
- UI code lấy màu qua `useTheme()` — không static import FTheme để lấy màu (test được phép).
- Spacing: dùng tokens từ `@/shared/styles` hoặc `MOTION` config; số geometry-coupled (slot/pill/top capsule/padding bar) tính từ `onLayout` hoặc `MOTION` — exempt kèm comment theo AGENTS.md.
- Không sửa `babel.config.js` (worklets plugin đã ở cuối), `metro.config.js`, `postinstall`, `patches/`.
- Làm việc trên `dev`. Commit: `type(scope): lowercase imperative summary`.
- Lint: không tạo warning mới dạng `react/no-unstable-nested-components` — các render prop đặt ở module level.

## File Structure

```text
src/app/navigation/
  BottomNavigator.tsx              # (sửa) tabBar={renderTabBar}, xóa styles/PlatformPressable cũ
  types.ts                         # không đổi
  config/bottomBarMotion.ts        # (mới) MOTION tokens + geometry helpers thuần (worklet-safe)
  components/AnimatedBottomBar.tsx # (mới) custom tabBar: layout, safe area, keyboard hide, commit
  components/BottomBarItem.tsx     # (mới) icon + a11y + crossfade + press scale
  components/SlidingIndicator.tsx  # (mới) capsule render-only (đọc 2 cạnh spring)
  hooks/useBottomBarMotion.ts      # (mới) spring 2 cạnh, press/preview feedback, snap/restore
  hooks/useBottomBarGesture.ts     # (mới) phân xử tap/hold-drag, hysteresis, commit
src/core/theme/
  FTheme.ts                        # (sửa) ColorsProps + FTheme.colors thêm nhóm tabBar
  DarkTheme.ts                     # (sửa) DarkTheme.colors thêm nhóm tabBar
__tests__/
  bottomBarGeometry.test.ts        # (mới)
  tabBarThemeTokens.test.ts        # (mới)
  BottomNavigator.test.tsx         # (sửa) khớp bar mới
  AnimatedBottomBar.test.tsx       # (mới) indicator, item, bar, commit/preventDefault
```

---

### Task 1: Geometry & motion config (hàm thuần, TDD)

**Files:**
- Create: `src/app/navigation/config/bottomBarMotion.ts`
- Test: `__tests__/bottomBarGeometry.test.ts`

**Interfaces:**
- Consumes: không có (thuần, không import RN/theme).
- Produces (mọi task sau dùng): `MOTION` const; `BarGeometry {barWidth; padding; tabCount}`; `slotWidth(g)`, `tabCenterX(g, index)`, `pillWidth(g)`, `capsuleEdges(centerX, halfWidth, g) → {left, width}`, `clampCenterX(pointerX, g)`, `indexFromX(pointerX, g)` (không hysteresis — dùng cho tap), `candidateFromX(pointerX, g, current)` (có hysteresis — dùng cho drag), `isInsideDropZone(x, y, barWidth, barHeight)`. Các hàm dùng trong worklet có directive `'worklet'`.

- [ ] **Step 1: Write the failing test**

Tạo `__tests__/bottomBarGeometry.test.ts`:

```ts
import {
  BarGeometry,
  MOTION,
  capsuleEdges,
  candidateFromX,
  clampCenterX,
  indexFromX,
  isInsideDropZone,
  pillWidth,
  slotWidth,
  tabCenterX,
} from '@/app/navigation/config/bottomBarMotion';

const g: BarGeometry = {barWidth: 364, padding: 6, tabCount: 4};
// slotWidth = (364 - 12) / 4 = 88

describe('bottomBarGeometry', () => {
  it('computes slot, center and pill width', () => {
    expect(slotWidth(g)).toBe(88);
    expect(tabCenterX(g, 0)).toBe(50); // 6 + 88 * 0.5
    expect(tabCenterX(g, 3)).toBe(314); // 6 + 88 * 3.5
    expect(pillWidth(g)).toBe(84); // 88 - 4
  });

  it('clamps capsule edges inside the bar inner area, width >= 0', () => {
    expect(capsuleEdges(50, 42, g)).toEqual({left: 8, width: 84});
    const stretched = capsuleEdges(330, 51, g); // right = 381 > 358
    expect(stretched.left + stretched.width).toBeLessThanOrEqual(358);
    expect(capsuleEdges(50, 0, g).width).toBe(0);
  });

  it('clamps drag center between first and last tab centers', () => {
    expect(clampCenterX(-20, g)).toBe(50);
    expect(clampCenterX(500, g)).toBe(314);
    expect(clampCenterX(200, g)).toBe(200);
  });

  it('maps pointer x to tab index without hysteresis (tap)', () => {
    expect(indexFromX(50, g)).toBe(0);
    expect(indexFromX(93, g)).toBe(0); // 94 là ranh giới tab 0/1
    expect(indexFromX(94, g)).toBe(1);
    expect(indexFromX(313, g)).toBe(3);
    expect(indexFromX(-50, g)).toBe(0);
    expect(indexFromX(400, g)).toBe(3);
  });

  it('selects drag candidate with 6dp hysteresis around boundaries', () => {
    // ranh giới tab 0/1 tại x = 94
    expect(candidateFromX(94 + 5, g, 0)).toBe(0); // trong vùng hysteresis
    expect(candidateFromX(94 + 6, g, 0)).toBe(1); // đã vượt
    expect(candidateFromX(94 - 5, g, 1)).toBe(1);
    expect(candidateFromX(94 - 6, g, 1)).toBe(0);
    // nhảy nhiều ô trong 1 event: tính thẳng ô tại vị trí mới
    expect(candidateFromX(300, g, 0)).toBe(3);
    expect(candidateFromX(-50, g, 0)).toBe(0);
    expect(candidateFromX(400, g, 3)).toBe(3);
  });

  it('checks drop zone as bar rect expanded 16dp each side', () => {
    expect(isInsideDropZone(-16, 30, 364, 64)).toBe(true);
    expect(isInsideDropZone(-17, 30, 364, 64)).toBe(false);
    expect(isInsideDropZone(364 + 16, 30, 364, 64)).toBe(true);
    expect(isInsideDropZone(364 + 17, 30, 364, 64)).toBe(false);
    expect(isInsideDropZone(100, -16, 364, 64)).toBe(true);
    expect(isInsideDropZone(100, -17, 364, 64)).toBe(false);
    expect(isInsideDropZone(100, 80, 364, 64)).toBe(false);
    expect(MOTION.holdActivationMs).toBe(220);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/bottomBarGeometry.test.ts`
Expected: FAIL — `Cannot find module '@/app/navigation/config/bottomBarMotion'`

- [ ] **Step 3: Write the implementation**

Tạo `src/app/navigation/config/bottomBarMotion.ts` (thông số nguồn: motion spec mục 2, 3.2, 5, 7):

```ts
/**
 * Bottom bar motion/interaction tokens + pure geometry helpers.
 * Values are starting points from the motion spec (sections 2, 3.2, 5, 7);
 * tune on device without touching logic. Functions called from worklets
 * carry the 'worklet' directive.
 */
export interface BarGeometry {
  barWidth: number;
  padding: number;
  tabCount: number;
}

export const MOTION = {
  // Interaction thresholds (spec 2 / 5)
  holdActivationMs: 220,
  moveSlop: 8,
  hysteresis: 6,
  dropZonePad: 16,

  // Layout (spec 3.2)
  barHeight: 64,
  barPadding: 6,
  capsuleHeight: 52,
  pillGap: 4, // pillWidth = slotWidth - 4
  iconSize: 26,
  bottomGap: 8,

  // Press feedback (spec 7)
  pressScale: 0.94,
  pressInMs: 70,
  pressOutMs: 120,

  // Preview (spec 5.1 / 7)
  previewScale: 1.04,
  previewMs: 100,

  // Icon crossfade (spec 7)
  crossfadeMs: 140,
  crossfadeDip: 0.5,

  // Stretch limits (spec 7)
  dragStretchMax: 1.12,
  dragStretchMs: 80,
  velocityDivisor: 4000,

  // Springs (spec 7)
  springTapLead: {stiffness: 420, damping: 32, mass: 1},
  springTapTrail: {stiffness: 280, damping: 30, mass: 1},
  springSnap: {stiffness: 420, damping: 34, mass: 1},
  springRestore: {stiffness: 380, damping: 34, mass: 1},

  // Keyboard hide (spec 8.6)
  keyboardMs: 200,
} as const;

export const slotWidth = (g: BarGeometry): number =>
  (g.barWidth - 2 * g.padding) / g.tabCount;

export const tabCenterX = (g: BarGeometry, index: number): number =>
  g.padding + slotWidth(g) * (index + 0.5);

export const pillWidth = (g: BarGeometry): number =>
  Math.max(slotWidth(g) - MOTION.pillGap, 0);

/** Render edges clamped to the bar inner area; width always >= 0 (spec 7). */
export const capsuleEdges = (
  centerX: number,
  halfWidth: number,
  g: BarGeometry,
): {left: number; width: number} => {
  'worklet';
  const lo = g.padding;
  const hi = g.barWidth - g.padding;
  const left = Math.min(Math.max(centerX - halfWidth, lo), hi);
  const right = Math.min(Math.max(centerX + halfWidth, lo), hi);
  return {left, width: Math.max(right - left, 0)};
};

/** Drag center is limited to the first..last tab centers (spec 5.2). */
export const clampCenterX = (pointerX: number, g: BarGeometry): number => {
  'worklet';
  const first = tabCenterX(g, 0);
  const last = tabCenterX(g, g.tabCount - 1);
  return Math.min(Math.max(pointerX, first), last);
};

/** Tab under pointerX, no hysteresis — used for taps. */
export const indexFromX = (pointerX: number, g: BarGeometry): number => {
  'worklet';
  const raw = Math.floor((pointerX - g.padding) / slotWidth(g));
  return Math.min(Math.max(raw, 0), g.tabCount - 1);
};

/** Tab under pointerX with hysteresis around boundaries (spec 5.2). */
export const candidateFromX = (
  pointerX: number,
  g: BarGeometry,
  current: number,
): number => {
  'worklet';
  const candidate = indexFromX(pointerX, g);
  if (candidate === current) {
    return current;
  }
  // Boundary crossed: require hysteresis past the shared edge. Multi-tab
  // jumps are already far past it and resolve straight to the new tab.
  const edgeX = g.padding + slotWidth(g) * (candidate > current ? candidate : current);
  const delta = candidate > current ? pointerX - edgeX : edgeX - pointerX;
  return delta >= MOTION.hysteresis ? candidate : current;
};

/** Drop zone: bar rect expanded dropZonePad each side (spec 5.4). */
export const isInsideDropZone = (
  x: number,
  y: number,
  barWidth: number,
  barHeight: number,
): boolean => {
  'worklet';
  const pad = MOTION.dropZonePad;
  return (
    x >= -pad && x <= barWidth + pad && y >= -pad && y <= barHeight + pad
  );
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/bottomBarGeometry.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Quality gates**

Run: `npx tsc --noEmit && npm run lint`
Expected: 0 errors (warning cũ ở file khác chấp nhận được)

- [ ] **Step 6: Commit**

```bash
git add src/app/navigation/config/bottomBarMotion.ts __tests__/bottomBarGeometry.test.ts
git commit -m "feat(navigation): add bottom bar motion config and geometry helpers"
```

---

### Task 2: tabBar theme tokens

**Files:**
- Modify: `src/core/theme/FTheme.ts` (interface `ColorsProps` ~dòng 123–142; object `colors` của FTheme ~dòng 313–330)
- Modify: `src/core/theme/DarkTheme.ts` (object `colors` ~dòng 63–85)
- Test: `__tests__/tabBarThemeTokens.test.ts`

**Interfaces:**
- Consumes: `colors` từ `src/core/theme/colors.ts` (đã có sẵn).
- Produces: `colors.tabBar.{background, indicator, iconActive, iconInactive, border}` trên cả light/dark — Task 3/4/7 đọc qua `useTheme()`.

- [ ] **Step 1: Write the failing test**

Tạo `__tests__/tabBarThemeTokens.test.ts`:

```ts
import FTheme from '@/core/theme/FTheme';
import {DarkTheme} from '@/core/theme/DarkTheme';

const KEYS = [
  'background',
  'indicator',
  'iconActive',
  'iconInactive',
  'border',
] as const;

describe('tabBar theme tokens', () => {
  it.each(KEYS)('FTheme.colors.tabBar.%s is a non-empty string', key => {
    expect(typeof FTheme.colors.tabBar[key]).toBe('string');
    expect(FTheme.colors.tabBar[key].length).toBeGreaterThan(0);
  });

  it.each(KEYS)('DarkTheme.colors.tabBar.%s is a non-empty string', key => {
    expect(typeof DarkTheme.colors.tabBar[key]).toBe('string');
    expect(DarkTheme.colors.tabBar[key].length).toBeGreaterThan(0);
  });

  it('light and dark indicator differ', () => {
    expect(FTheme.colors.tabBar.indicator).not.toBe(
      DarkTheme.colors.tabBar.indicator,
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/tabBarThemeTokens.test.ts`
Expected: FAIL — `Property 'tabBar' does not exist on type 'ColorsProps'`

- [ ] **Step 3: Implement — FTheme.ts**

Trong `src/core/theme/FTheme.ts`, thêm vào interface `ColorsProps` (trước `raw: AppColors;`):

```ts
  tabBar: {
    background: string;
    indicator: string;
    iconActive: string;
    iconInactive: string;
    border: string;
  };
```

Và trong object `colors` của `FTheme` (sau `title: colors.grey[900],`):

```ts
    tabBar: {
      background: colors.background.light.over,
      indicator: 'rgba(68, 186, 70, 0.18)',
      iconActive: colors.green[500],
      iconInactive: colors.grey[500],
      border: colors.grey[200],
    },
```

- [ ] **Step 4: Implement — DarkTheme.ts**

Trong `src/core/theme/DarkTheme.ts`, object `colors` (sau `notification: …`):

```ts
    tabBar: {
      background: colors.background.dark.over,
      indicator: 'rgba(68, 186, 70, 0.22)',
      iconActive: colors.green[400],
      iconInactive: colors.content.onDark.secondary,
      border: colors.content.onDark.stroke,
    },
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx jest __tests__/tabBarThemeTokens.test.ts`
Expected: PASS

- [ ] **Step 6: Quality gates + commit**

Run: `npx tsc --noEmit && npm test`
Expected: tsc sạch, toàn bộ suite PASS (test cũ không assert key chặt nên không vỡ)

```bash
git add src/core/theme/FTheme.ts src/core/theme/DarkTheme.ts __tests__/tabBarThemeTokens.test.ts
git commit -m "feat(theme): add tabbar color tokens for custom bottom bar"
```

---

### Task 3: SlidingIndicator component

**Files:**
- Create: `src/app/navigation/components/SlidingIndicator.tsx`
- Test: `__tests__/AnimatedBottomBar.test.tsx` (tạo khung file, các task sau bổ sung)

**Interfaces:**
- Consumes: `capsuleEdges`, `BarGeometry` từ `../config/bottomBarMotion`; `SharedValue` từ reanimated.
- Produces: `SlidingIndicator({edgeLeft, edgeRight, opacity, geometry, top, height, color})` — render-only, `pointerEvents="none"`, đọc 2 cạnh spring và tự derive center/half trong `useAnimatedStyle` (tránh custom hooks phái sinh ở Task 7).

- [ ] **Step 1: Write the failing test**

Tạo `__tests__/AnimatedBottomBar.test.tsx`:

```tsx
import 'react-native';
import React from 'react';
import {View} from 'react-native';
import renderer, {ReactTestRenderer} from 'react-test-renderer';
import {useSharedValue} from 'react-native-reanimated';

import {MOTION} from '@/app/navigation/config/bottomBarMotion';
import {SlidingIndicator} from '@/app/navigation/components/SlidingIndicator';

describe('SlidingIndicator', () => {
  it('renders an absolute, non-interactive capsule', () => {
    let tree!: ReactTestRenderer;

    const Probe = () => {
      const edgeLeft = useSharedValue(8);
      const edgeRight = useSharedValue(92);
      const opacity = useSharedValue(1);
      return (
        <SlidingIndicator
          edgeLeft={edgeLeft}
          edgeRight={edgeRight}
          opacity={opacity}
          geometry={{barWidth: 364, padding: MOTION.barPadding, tabCount: 4}}
          top={MOTION.barPadding}
          height={MOTION.capsuleHeight}
          color="#FF0000"
        />
      );
    };

    renderer.act(() => {
      tree = renderer.create(<Probe />);
    });

    const capsule = tree.root.findByProps({testID: 'sliding-indicator'});
    const style = Array.isArray(capsule.props.style)
      ? Object.assign({}, ...capsule.props.style.filter(Boolean))
      : capsule.props.style;
    expect(style.position).toBe('absolute');
    expect(capsule.props.pointerEvents).toBe('none');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/AnimatedBottomBar.test.tsx`
Expected: FAIL — `Cannot find module '@/app/navigation/components/SlidingIndicator'`

- [ ] **Step 3: Implement**

Tạo `src/app/navigation/components/SlidingIndicator.tsx`:

```tsx
import React from 'react';
import {StyleSheet} from 'react-native';
import Animated, {useAnimatedStyle} from 'react-native-reanimated';
import type {SharedValue} from 'react-native-reanimated';

import {BarGeometry, capsuleEdges} from '../config/bottomBarMotion';

interface SlidingIndicatorProps {
  edgeLeft: SharedValue<number>;
  edgeRight: SharedValue<number>;
  opacity: SharedValue<number>;
  /** Static measured values — only read, never animated. */
  geometry: BarGeometry;
  top: number;
  height: number;
  color: string;
}

/**
 * The active-tab capsule. Render-only: reads shared values written by the
 * motion hook, never handles touch or navigation (spec 8.2).
 */
export const SlidingIndicator = ({
  edgeLeft,
  edgeRight,
  opacity,
  geometry,
  top,
  height,
  color,
}: SlidingIndicatorProps) => {
  const style = useAnimatedStyle(() => {
    const center = (edgeLeft.value + edgeRight.value) / 2;
    const half = Math.max((edgeRight.value - edgeLeft.value) / 2, 0);
    const {left, width} = capsuleEdges(center, half, geometry);
    return {left, width, opacity: opacity.value};
  });

  return (
    <Animated.View
      testID="sliding-indicator"
      pointerEvents="none"
      style={[
        styles.base,
        style,
        // Geometry-coupled values derived from bar measurement — exempt from
        // spacing tokens per AGENTS.md.
        {top, height, borderRadius: height / 2, backgroundColor: color},
      ]}
    />
  );
};

const styles = StyleSheet.create({
  base: {
    position: 'absolute',
  },
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/AnimatedBottomBar.test.tsx`
Expected: PASS

- [ ] **Step 5: Quality gates + commit**

Run: `npx tsc --noEmit && npm test && npm run lint`
Expected: sạch

```bash
git add src/app/navigation/components/SlidingIndicator.tsx __tests__/AnimatedBottomBar.test.tsx
git commit -m "feat(navigation): add sliding capsule indicator component"
```

---

### Task 4: BottomBarItem component

**Files:**
- Create: `src/app/navigation/components/BottomBarItem.tsx`
- Modify: `__tests__/AnimatedBottomBar.test.tsx`

**Interfaces:**
- Consumes: `MOTION` từ config; `useTheme` từ `@/core/theme`.
- Produces:

```ts
interface BottomBarItemProps {
  label: string; // accessibilityLabel (i18n hoặc options của screen)
  selected: boolean; // theo state.index — KHÔNG theo preview (spec 5.2/9)
  Icon: React.ComponentType<{width: number; height: number; color: string}>;
  scale: SharedValue<number>; // press/preview feedback, motion hook ghi
  onActivate: () => void; // a11y activate (VoiceOver/TalkBack) → commit trực tiếp
}
```

- [ ] **Step 1: Write the failing test**

Thêm vào `__tests__/AnimatedBottomBar.test.tsx`. Đặt `jest.mock` ở vùng mock đầu file (jest hoist tất cả `jest.mock` lên trên import), import `BottomBarItem` gộp vào khối import trên đầu:

```tsx
jest.mock('@/core/theme', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        tabBar: {
          background: '#FFFFFF',
          indicator: 'rgba(0,0,0,0.1)',
          iconActive: '#44BA46',
          iconInactive: '#A2ADC4',
          border: '#E7ECF4',
        },
      },
    },
    isDark: false,
  }),
}));

import {BottomBarItem} from '@/app/navigation/components/BottomBarItem';

const FakeIcon = ({
  width,
  height,
  color,
}: {
  width: number;
  height: number;
  color: string;
}) => <View testID="fake-icon" width={width} height={height} color={color} />;

describe('BottomBarItem', () => {
  it('renders tab role, label, selected state and 26x26 themed icon', () => {
    let tree!: ReactTestRenderer;

    const Probe = () => {
      const scale = useSharedValue(1);
      return (
        <BottomBarItem
          label="Trang chủ"
          selected
          Icon={FakeIcon}
          scale={scale}
          onActivate={jest.fn()}
        />
      );
    };

    renderer.act(() => {
      tree = renderer.create(<Probe />);
    });

    const item = tree.root.findByProps({accessibilityRole: 'tab'});
    expect(item.props.accessibilityLabel).toBe('Trang chủ');
    expect(item.props.accessibilityState).toEqual({selected: true});

    const icon = tree.root.findByProps({testID: 'fake-icon'});
    expect(icon.props.width).toBe(26);
    expect(icon.props.height).toBe(26);
    expect(icon.props.color).toBe('#44BA46');
  });

  it('fires onActivate on accessibility activate action', () => {
    let tree!: ReactTestRenderer;
    const onActivate = jest.fn();

    const Probe = () => {
      const scale = useSharedValue(1);
      return (
        <BottomBarItem
          label="Tài khoản"
          selected={false}
          Icon={FakeIcon}
          scale={scale}
          onActivate={onActivate}
        />
      );
    };

    renderer.act(() => {
      tree = renderer.create(<Probe />);
    });

    const item = tree.root.findByProps({accessibilityRole: 'tab'});
    expect(item.props.accessibilityState).toEqual({selected: false});
    renderer.act(() => {
      item.props.onAccessibilityAction({
        nativeEvent: {actionName: 'activate'},
      });
    });
    expect(onActivate).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/AnimatedBottomBar.test.tsx`
Expected: FAIL — `Cannot find module '@/app/navigation/components/BottomBarItem'`

- [ ] **Step 3: Implement**

Tạo `src/app/navigation/components/BottomBarItem.tsx`:

```tsx
import React, {useEffect} from 'react';
import {AccessibilityActionEvent, StyleSheet} from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import {useTheme} from '@/core/theme';

import {MOTION} from '../config/bottomBarMotion';

interface BottomBarItemProps {
  label: string;
  selected: boolean;
  Icon: React.ComponentType<{width: number; height: number; color: string}>;
  scale: SharedValue<number>;
  onActivate: () => void;
}

/**
 * One tab: icon + accessibility. Selection color follows the real navigation
 * state only — never the drag preview (spec 5.2 / 9). No filled/outline SVG
 * pair exists in the repo, so selection is color/opacity only (spec 3.3).
 */
export const BottomBarItem = ({
  label,
  selected,
  Icon,
  scale,
  onActivate,
}: BottomBarItemProps) => {
  const {colors} = useTheme().theme;
  const opacity = useSharedValue(1);

  // Crossfade: short opacity dip when selection lands on this tab (spec 7).
  useEffect(() => {
    if (!selected) {
      return;
    }
    opacity.value = MOTION.crossfadeDip;
    opacity.value = withTiming(1, {duration: MOTION.crossfadeMs});
  }, [selected, opacity]);

  const anim = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
    opacity: opacity.value,
  }));

  const handleAccessibilityAction = (e: AccessibilityActionEvent) => {
    if (e.nativeEvent.actionName === 'activate') {
      onActivate();
    }
  };

  return (
    <Animated.View
      accessible
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{selected}}
      accessibilityActions={[{name: 'activate'}]}
      onAccessibilityAction={handleAccessibilityAction}
      style={[styles.item, anim]}>
      <Icon
        width={MOTION.iconSize}
        height={MOTION.iconSize}
        color={selected ? colors.tabBar.iconActive : colors.tabBar.iconInactive}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/AnimatedBottomBar.test.tsx`
Expected: PASS

- [ ] **Step 5: Quality gates + commit**

Run: `npx tsc --noEmit && npm test && npm run lint`
Expected: sạch

```bash
git add src/app/navigation/components/BottomBarItem.tsx __tests__/AnimatedBottomBar.test.tsx
git commit -m "feat(navigation): add accessible bottom bar item with crossfade"
```

---

### Task 5: useBottomBarMotion hook

**Files:**
- Create: `src/app/navigation/hooks/useBottomBarMotion.ts`

**Interfaces:**
- Consumes: config helpers (Task 1); `useSharedValue`, `withSpring`, `withTiming`, `cancelAnimation`, `useReducedMotion` từ reanimated.
- Produces (Task 6/7 dùng):

```ts
interface BottomBarMotionApi {
  edgeLeft: SharedValue<number>; // capsule cạnh trái (UI thread)
  edgeRight: SharedValue<number>; // capsule cạnh phải
  capsuleOpacity: SharedValue<number>;
  iconScales: SharedValue<number>[]; // length 4, theo index tab
  placeAt: (g: BarGeometry, index: number) => void; // đặt ngay, không animate (NAV-01/15)
  snapTo: (g: BarGeometry, index: number, kind: 'tap' | 'snap' | 'restore') => void;
  followDrag: (g: BarGeometry, pointerX: number) => void; // tâm bám tay trực tiếp
  dragVelocity: (velocityX: number) => void; // giãn 1–1.12 theo vận tốc
  pressIn: (index: number) => void; // scale 0.94 / 70ms
  pressOut: (index: number) => void; // scale về 1 / 120ms
  previewIcon: (index: number, on: boolean) => void; // scale 1.04 / 100ms
  cancelEdges: () => void; // hủy spring trước khi drag chiếm điều khiển
}
export const useBottomBarMotion = (): BottomBarMotionApi;
```

Không có unit test riêng (worklet chạy trên UI thread — theo design, nghiệm thu qua NAV checklist ở Task 8). Kiểm chứng bằng tsc + integration Task 7/8.

- [ ] **Step 1: Implement**

Tạo `src/app/navigation/hooks/useBottomBarMotion.ts`:

```ts
import {useCallback, useMemo} from 'react';
import {
  cancelAnimation,
  SharedValue,
  useReducedMotion,
  useSharedValue,
  WithSpringConfig,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import {
  BarGeometry,
  MOTION,
  clampCenterX,
  pillWidth,
  tabCenterX,
} from '../config/bottomBarMotion';

export interface BottomBarMotionApi {
  edgeLeft: SharedValue<number>;
  edgeRight: SharedValue<number>;
  capsuleOpacity: SharedValue<number>;
  iconScales: SharedValue<number>[];
  placeAt: (g: BarGeometry, index: number) => void;
  snapTo: (
    g: BarGeometry,
    index: number,
    kind: 'tap' | 'snap' | 'restore',
  ) => void;
  followDrag: (g: BarGeometry, pointerX: number) => void;
  dragVelocity: (velocityX: number) => void;
  pressIn: (index: number) => void;
  pressOut: (index: number) => void;
  previewIcon: (index: number, on: boolean) => void;
  cancelEdges: () => void;
}

/**
 * Owns all capsule/icon shared values. Every method is a worklet so gesture
 * callbacks can call it on the UI thread; they are also safe from JS.
 * Two independent edge springs create the tap stretch (spec 7): the leading
 * edge uses higher stiffness, so the capsule stretches mid-flight and
 * contracts on settle. Render-side clamps keep edges/width sane.
 */
export const useBottomBarMotion = (): BottomBarMotionApi => {
  const reducedMotion = useReducedMotion();
  const edgeLeft = useSharedValue(0);
  const edgeRight = useSharedValue(0);
  const capsuleOpacity = useSharedValue(1);
  const dragStretch = useSharedValue(1);
  const s0 = useSharedValue(1);
  const s1 = useSharedValue(1);
  const s2 = useSharedValue(1);
  const s3 = useSharedValue(1);
  const iconScales = useMemo(() => [s0, s1, s2, s3], [s0, s1, s2, s3]);

  const placeAt = useCallback(
    (g: BarGeometry, index: number) => {
      'worklet';
      const half = pillWidth(g) / 2;
      const center = tabCenterX(g, index);
      cancelAnimation(edgeLeft);
      cancelAnimation(edgeRight);
      edgeLeft.value = center - half;
      edgeRight.value = center + half;
      capsuleOpacity.value = 1;
    },
    [edgeLeft, edgeRight, capsuleOpacity],
  );

  const snapTo = useCallback(
    (g: BarGeometry, index: number, kind: 'tap' | 'snap' | 'restore') => {
      'worklet';
      const half = pillWidth(g) / 2;
      const center = tabCenterX(g, index);
      if (reducedMotion) {
        // Reduce Motion: không spring/giãn — đặt thẳng (spec 9).
        edgeLeft.value = center - half;
        edgeRight.value = center + half;
        return;
      }
      const movingRight = center >= (edgeLeft.value + edgeRight.value) / 2;
      let lead: WithSpringConfig = MOTION.springSnap;
      let trail: WithSpringConfig = MOTION.springSnap;
      if (kind === 'tap') {
        lead = movingRight ? MOTION.springTapLead : MOTION.springTapTrail;
        trail = movingRight ? MOTION.springTapTrail : MOTION.springTapLead;
      } else if (kind === 'restore') {
        lead = MOTION.springRestore;
        trail = MOTION.springRestore;
      }
      edgeLeft.value = withSpring(center - half, trail);
      edgeRight.value = withSpring(center + half, lead);
    },
    [edgeLeft, edgeRight, reducedMotion],
  );

  const followDrag = useCallback(
    (g: BarGeometry, pointerX: number) => {
      'worklet';
      // Tâm bám tay trực tiếp mỗi event; chỉ stretch được làm mềm (spec 5.2).
      const half = (pillWidth(g) / 2) * dragStretch.value;
      const center = clampCenterX(pointerX, g);
      edgeLeft.value = center - half;
      edgeRight.value = center + half;
    },
    [edgeLeft, edgeRight, dragStretch],
  );

  const dragVelocity = useCallback(
    (velocityX: number) => {
      'worklet';
      if (reducedMotion) {
        return;
      }
      const target = Math.min(
        1 + Math.abs(velocityX) / MOTION.velocityDivisor,
        MOTION.dragStretchMax,
      );
      dragStretch.value = withTiming(target > 1.02 ? target : 1, {
        duration: MOTION.dragStretchMs,
      });
    },
    [dragStretch, reducedMotion],
  );

  const pressIn = useCallback(
    (index: number) => {
      'worklet';
      iconScales[index].value = withTiming(MOTION.pressScale, {
        duration: MOTION.pressInMs,
      });
    },
    [iconScales],
  );

  const pressOut = useCallback(
    (index: number) => {
      'worklet';
      iconScales[index].value = withTiming(1, {duration: MOTION.pressOutMs});
    },
    [iconScales],
  );

  const previewIcon = useCallback(
    (index: number, on: boolean) => {
      'worklet';
      iconScales[index].value = withTiming(
        on ? MOTION.previewScale : 1,
        {duration: MOTION.previewMs},
      );
    },
    [iconScales],
  );

  const cancelEdges = useCallback(() => {
    'worklet';
    cancelAnimation(edgeLeft);
    cancelAnimation(edgeRight);
  }, [edgeLeft, edgeRight]);

  return useMemo(
    () => ({
      edgeLeft,
      edgeRight,
      capsuleOpacity,
      iconScales,
      placeAt,
      snapTo,
      followDrag,
      dragVelocity,
      pressIn,
      pressOut,
      previewIcon,
      cancelEdges,
    }),
    [
      edgeLeft,
      edgeRight,
      capsuleOpacity,
      iconScales,
      placeAt,
      snapTo,
      followDrag,
      dragVelocity,
      pressIn,
      pressOut,
      previewIcon,
      cancelEdges,
    ],
  );
};
```

- [ ] **Step 2: Quality gates**

Run: `npx tsc --noEmit && npm test && npm run lint`
Expected: sạch (hook chưa được mount — chỉ biên dịch)

- [ ] **Step 3: Commit**

```bash
git add src/app/navigation/hooks/useBottomBarMotion.ts
git commit -m "feat(navigation): add bottom bar motion hook with edge springs"
```

---

### Task 6: useBottomBarGesture hook + haptic dependency

**Files:**
- Modify: `package.json`, `package-lock.json`, `ios/Podfile.lock` (cài `react-native-haptic-feedback`)
- Create: `src/app/navigation/hooks/useBottomBarGesture.ts`

**Interfaces:**
- Consumes: `BottomBarMotionApi` (Task 5); `indexFromX`, `candidateFromX`, `clampCenterX`, `isInsideDropZone`, `MOTION` (Task 1).
- Produces (Task 7 dùng):

```ts
interface BottomBarGestureParams {
  routeKeys: string[]; // state.routes.map(r => r.key); gesture tạo lại mỗi render nên worklet luôn capture giá trị mới
  motion: BottomBarMotionApi;
  geometry: BarGeometry | null; // null trước layout đầu tiên
  activeIndex: number; // state.index — dùng cho restore khi hủy
  commitSelection: (routeKey: string) => void; // JS callback do AnimatedBottomBar cung cấp
}
interface BottomBarGestureApi {
  composed: GestureType; // Gesture.Exclusive(longPress, tap)
  cancelPreview: (activeIndex: number) => void; // gọi khi state.index đổi từ ngoài (NAV-14)
  selectTab: (routeKey: string) => void; // a11y activate → commit trực tiếp
}
export const useBottomBarGesture = (params: BottomBarGestureParams): BottomBarGestureApi;
```

Quy tắc phân xử (spec 8.4): Tap `maxDuration(220)` + `maxDelta 8` — chỉ thắng khi nhấc tay trước 220ms và dịch ≤8dp. LongPress `duration(220)` + `maxDistance(8)` — kích hoạt preview đúng 220ms; từ lúc đó tap không thể thắng. Cả hai chung `phase` shared value nên một chuỗi touch không bao giờ commit 2 lần (NAV-16/20).

- [ ] **Step 1: Install haptic dependency**

```bash
npm install react-native-haptic-feedback
cd ios && bundle exec pod install
```

Expected: install thành công, pods cập nhật (chạy pod install đúng 1 lần trong cả plan).

- [ ] **Step 2: Implement the hook**

Tạo `src/app/navigation/hooks/useBottomBarGesture.ts`:

```ts
import {useCallback, useMemo} from 'react';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {
  Gesture,
  GestureType,
  runOnJS,
  useSharedValue,
} from 'react-native-gesture-handler';

import {
  BarGeometry,
  MOTION,
  candidateFromX,
  indexFromX,
  isInsideDropZone,
} from '../config/bottomBarMotion';
import {BottomBarMotionApi} from './useBottomBarMotion';

export interface BottomBarGestureParams {
  routeKeys: string[];
  motion: BottomBarMotionApi;
  geometry: BarGeometry | null;
  commitSelection: (routeKey: string) => void;
}

export interface BottomBarGestureApi {
  composed: GestureType;
  cancelPreview: (activeIndex: number) => void;
  selectTab: (routeKey: string) => void;
}

// UI-thread gesture phases (spec section 6).
const PHASE = {Idle: 0, Pressed: 1, Preview: 2, Settling: 3} as const;

const triggerHaptic = () => {
  ReactNativeHapticFeedback.trigger('impactLight', {
    enableVibrateFallback: true,
    ignoreAndroidSystemSettings: false,
  });
};

/**
 * The single arbiter for the whole bar (spec 8.4): Tap and LongPress share
 * `phase` + `previewIndex`, so one touch sequence can never commit twice.
 * Navigation is only ever reached through runOnJS(commitSelection) at commit
 * time — never from a worklet, never per-frame (spec 8.3/8.5).
 */
export const useBottomBarGesture = (
  params: BottomBarGestureParams,
): BottomBarGestureApi => {
  const {routeKeys, motion, geometry, activeIndex, commitSelection} = params;

  const phase = useSharedValue<number>(PHASE.Idle);
  const previewIndex = useSharedValue(-1);

  const restoreVisual = (activeIndex: number) => {
    'worklet';
    if (geometry) {
      motion.snapTo(geometry, activeIndex, 'restore');
    }
  };

  const tap = Gesture.Tap()
    .maxDuration(MOTION.holdActivationMs)
    .maxDeltaX(MOTION.moveSlop)
    .maxDeltaY(MOTION.moveSlop)
    .onTouchesDown(event => {
      'worklet';
      // Mọi touch bắt đầu tại đây: press feedback trên tab dưới ngón (spec 4).
      phase.value = PHASE.Pressed;
      if (geometry && event.allTouches.length > 0) {
        motion.pressIn(indexFromX(event.allTouches[0].x, geometry));
      }
    })
    .onEnd(event => {
      'worklet';
      if (!geometry) {
        return;
      }
      const index = indexFromX(event.x, geometry);
      motion.pressOut(index);
      if (phase.value !== PHASE.Pressed) {
        return; // hold đã kích hoạt → tap của chuỗi này phải thất bại (spec 8.4)
      }
      if (phase.value === PHASE.Settling) {
        return; // chống commit trùng
      }
      phase.value = PHASE.Settling;
      runOnJS(commitSelection)(routeKeys[index]);
    })
    .onFinalize(() => {
      'worklet';
      if (phase.value === PHASE.Pressed) {
        phase.value = PHASE.Idle;
      }
    });

  const longPress = Gesture.LongPress()
    .duration(MOTION.holdActivationMs)
    .maxDistance(MOTION.moveSlop)
    .onStart(() => {
      'worklet';
      // Giữ đủ 220ms: vào preview (spec 5.1). Capsule giữ vị trí đang hiển thị,
      // không reset về tâm tab cũ. Haptic đúng 1 lần.
      phase.value = PHASE.Preview;
      previewIndex.value = -1;
      runOnJS(triggerHaptic)();
    })
    .onUpdate(event => {
      'worklet';
      if (phase.value !== PHASE.Preview || !geometry) {
        return;
      }
      const next = candidateFromX(event.x, geometry, previewIndex.value);
      if (next !== previewIndex.value) {
        if (previewIndex.value >= 0) {
          motion.previewIcon(previewIndex.value, false);
        }
        motion.previewIcon(next, true);
        previewIndex.value = next;
      }
      motion.followDrag(geometry, event.x);
      motion.dragVelocity(event.velocityX);
    })
    .onEnd((event, success) => {
      'worklet';
      if (phase.value !== PHASE.Preview || !geometry) {
        return; // hủy trước khi preview — tap/onFinalize đã xử lý
      }
      if (previewIndex.value >= 0) {
        motion.previewIcon(previewIndex.value, false);
      }
      const inside = isInsideDropZone(
        event.x,
        event.y,
        geometry.barWidth,
        MOTION.barHeight,
      );
      if (success && inside && previewIndex.value >= 0) {
        // Thả trong vùng: chọn preview, không dự đoán velocity (spec 5.3).
        const index = previewIndex.value;
        previewIndex.value = -1;
        phase.value = PHASE.Settling;
        runOnJS(commitSelection)(routeKeys[index]);
      } else {
        // Thả ngoài vùng / OS cancel / hủy: quay về active thực tế (spec 5.4).
        phase.value = PHASE.Idle;
        previewIndex.value = -1;
        restoreVisual(activeIndex);
      }
    })
    .onFinalize(() => {
      'worklet';
      if (phase.value === PHASE.Preview) {
        phase.value = PHASE.Idle;
      }
    });

  const composed = useMemo(
    () => Gesture.Exclusive(longPress, tap),
    [longPress, tap],
  );

  /** NAV-14: navigation đổi từ ngoài (back/deep link) trong khi preview. */
  const cancelPreview = useCallback(
    (activeIndex: number) => {
      if (previewIndex.value >= 0) {
        motion.previewIcon(previewIndex.value, false);
      }
      previewIndex.value = -1;
      if (phase.value === PHASE.Preview || phase.value === PHASE.Pressed) {
        phase.value = PHASE.Idle;
      }
      if (geometry) {
        motion.snapTo(geometry, activeIndex, 'restore');
      }
    },
    [motion, phase, previewIndex, geometry],
  );

  /** A11y activate (spec 9): commit trực tiếp, không qua gesture. */
  const selectTab = useCallback(
    (routeKey: string) => {
      commitSelection(routeKey);
    },
    [commitSelection],
  );

  return {composed, cancelPreview, selectTab};
};
```

**Lưu ý:** `onEnd` của LongPress có signature `(event, success)`; `event.activeIndex` không tồn tại — active index lấy từ `activeIndex` capture ở đầu hook (giá trị `state.index` của render hiện tại). `restoreVisual` là worklet cục bộ, không cần useCallback.

- [ ] **Step 3: Quality gates**

Run: `npx tsc --noEmit && npm test && npm run lint`
Expected: sạch (hook chưa mount)

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json ios/Podfile.lock src/app/navigation/hooks/useBottomBarGesture.ts
git commit -m "feat(navigation): add tap/hold-drag gesture arbiter with haptic"
```

---

### Task 7: AnimatedBottomBar assembly (layout, safe area, keyboard hide, commit)

**Files:**
- Create: `src/app/navigation/components/AnimatedBottomBar.tsx`
- Modify: `__tests__/AnimatedBottomBar.test.tsx`

**Interfaces:**
- Consumes: Task 3/4/5/6; `useTheme`, `useSafeAreaInsets`, `tokens` từ `@/shared/styles`, `useTranslation`.
- Produces: `AnimatedBottomBar(props: BottomTabBarProps)` — Task 8 truyền vào `tabBar=`. Cung cấp `commitSelection` (emit `tabPress` có `canPreventDefault` → navigate đúng 1 lần) và keyboard hide (spec 8.6).

- [ ] **Step 1: Write the failing test**

Thêm vào `__tests__/AnimatedBottomBar.test.tsx`. Vùng mock đầu file cuối cùng phải có: `@react-native-async-storage/async-storage` (nếu cần), `react-native-safe-area-context`, `@/core/theme`, `react-native-gesture-handler`, `react-native-haptic-feedback`. Thêm 2 mock mới:

```tsx
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 0, bottom: 34, left: 0, right: 0}),
}));

jest.mock('react-native-gesture-handler', () => {
  const RN = require('react-native');
  const chainable = () => {
    const g: Record<string, unknown> = {};
    [
      'maxDuration',
      'maxDeltaX',
      'maxDeltaY',
      'maxDistance',
      'onStart',
      'onUpdate',
      'onEnd',
      'onFinalize',
      'onTouchesDown',
      'onTouchesUp',
      'shouldCancelWhenOutside',
      'enabled',
    ].forEach(method => {
      g[method] = () => g;
    });
    return g;
  };
  return {
    Gesture: {
      Tap: chainable,
      LongPress: chainable,
      Exclusive: (...gestures: unknown[]) => gestures[0],
    },
    GestureDetector: (props: {children: React.ReactNode}) => (
      <RN.View>{props.children}</RN.View>
    ),
    runOnJS: (fn: unknown) => fn,
  };
});

jest.mock('react-native-haptic-feedback', () => ({
  default: {trigger: jest.fn()},
}));
```

Thêm import và describe block (kèm helpers):

```tsx
import {AnimatedBottomBar} from '@/app/navigation/components/AnimatedBottomBar';
import type {
  BottomTabBarProps,
  BottomTabNavigationState,
} from '@react-navigation/bottom-tabs';
import type {BottomTabParamList} from '@/app/navigation/types';

const ROUTE_NAMES: (keyof BottomTabParamList)[] = [
  'Home',
  'Automation',
  'Service',
  'Store',
];

const makeState = (
  index: number,
): BottomTabNavigationState<BottomTabParamList> => ({
  key: 'tab-root',
  index,
  stale: false,
  type: 'tab',
  routeNames: [...ROUTE_NAMES],
  routes: ROUTE_NAMES.map(name => ({
    key: `route-${name}`,
    name,
    params: undefined,
  })),
  history: [{type: 'route', key: `route-${ROUTE_NAMES[index]}`}],
});

const makeProps = (index: number): BottomTabBarProps => {
  const state = makeState(index);
  return {
    state,
    descriptors: Object.fromEntries(
      state.routes.map(route => [
        route.key,
        {
          route,
          navigation: {} as never,
          options: {
            tabBarAccessibilityLabel: route.name,
            tabBarIcon: () => <FakeIcon width={26} height={26} color="#000" />,
          },
          render: () => null,
        },
      ]),
    ) as BottomTabBarProps['descriptors'],
    navigation: {
      emit: jest.fn(() => ({defaultPrevented: false})),
      navigate: jest.fn(),
    } as never,
  } as unknown as BottomTabBarProps;
};

describe('AnimatedBottomBar', () => {
  it('renders 4 tabs and marks only state.index as selected', () => {
    let tree!: ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(<AnimatedBottomBar {...makeProps(2)} />);
    });

    const tabs = tree.root.findAllByProps({accessibilityRole: 'tab'});
    expect(tabs).toHaveLength(4);
    const selected = tabs.filter(
      tab => tab.props.accessibilityState.selected === true,
    );
    expect(selected).toHaveLength(1);
    expect(selected[0].props.accessibilityLabel).toBe('Service');
  });

  it('emits exactly one tabPress and navigates once on selectTab', () => {
    let tree!: ReactTestRenderer;
    const props = makeProps(0);
    renderer.act(() => {
      tree = renderer.create(<AnimatedBottomBar {...props} />);
    });

    const tabs = tree.root.findAllByProps({accessibilityRole: 'tab'});
    renderer.act(() => {
      tabs[3].props.onAccessibilityAction({
        nativeEvent: {actionName: 'activate'},
      });
    });

    expect(props.navigation.emit).toHaveBeenCalledTimes(1);
    expect(props.navigation.emit).toHaveBeenCalledWith(
      expect.objectContaining({type: 'tabPress', target: 'route-Store'}),
    );
    expect(props.navigation.navigate).toHaveBeenCalledWith('Store');
  });

  it('does not navigate when tabPress is prevented (NAV-13)', () => {
    let tree!: ReactTestRenderer;
    const props = makeProps(0);
    (props.navigation.emit as jest.Mock).mockReturnValue({
      defaultPrevented: true,
    });
    renderer.act(() => {
      tree = renderer.create(<AnimatedBottomBar {...props} />);
    });

    const tabs = tree.root.findAllByProps({accessibilityRole: 'tab'});
    renderer.act(() => {
      tabs[1].props.onAccessibilityAction({
        nativeEvent: {actionName: 'activate'},
      });
    });

    expect(props.navigation.navigate).not.toHaveBeenCalled();
  });
});
```

(`emit` của react-navigation nhận `{type, target, canPreventDefault}` và trả event có `defaultPrevented` — mock khớp đúng shape.)

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/AnimatedBottomBar.test.tsx`
Expected: FAIL — `Cannot find module '@/app/navigation/components/AnimatedBottomBar'`

- [ ] **Step 3: Implement**

Tạo `src/app/navigation/components/AnimatedBottomBar.tsx`:

```tsx
import React, {
  ComponentType,
  ReactElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {Keyboard, Platform, StyleSheet, View} from 'react-native';
import {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {GestureDetector} from 'react-native-gesture-handler';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';

import {useTheme} from '@/core/theme';
import {tokens} from '@/shared/styles';

import {BarGeometry, MOTION} from '../config/bottomBarMotion';
import {useBottomBarMotion} from '../hooks/useBottomBarMotion';
import {useBottomBarGesture} from '../hooks/useBottomBarGesture';
import {BottomBarItem} from './BottomBarItem';
import {SlidingIndicator} from './SlidingIndicator';

type IconComponentType = ComponentType<{
  width: number;
  height: number;
  color: string;
}>;

/** Our tabBarIcon returns the SVG component directly — extract its type. */
const iconComponent = (element: ReactElement | undefined): IconComponentType =>
  element?.type as IconComponentType;

/**
 * Custom tabBar (spec 8.2): measures layout, mounts indicator + items +
 * gesture arbiter, hides for the keyboard (spec 8.6). Selection source of
 * truth is state.index; the capsule is visual only.
 */
export const AnimatedBottomBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const {t} = useTranslation();
  const {theme, isDark} = useTheme();
  const {colors} = theme;

  const [geometry, setGeometry] = useState<BarGeometry | null>(null);
  const [keyboardUp, setKeyboardUp] = useState(false);
  // Đánh dấu commit: effect đồng bộ state bỏ qua placeAt nếu index mới đến
  // từ commit (capsule đã được snapTo animation), tránh đè mất animation.
  const lastCommitIndexRef = useRef<number | null>(null);

  const keyboardY = useSharedValue(0);
  const keyboardOpacity = useSharedValue(1);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Keyboard: ẩn visual, giữ chỗ layout (spec 8.6). Nếu đang kéo thì gesture
  // tự hủy qua cancelPreview khi state đổi hoặc touch bị hệ thống ngắt.
  useEffect(() => {
    const move = (hidden: boolean) => {
      if (!mountedRef.current) {
        return;
      }
      const target = hidden ? MOTION.barHeight + MOTION.bottomGap : 0;
      keyboardY.value = withTiming(target, {duration: MOTION.keyboardMs});
      keyboardOpacity.value = withTiming(hidden ? 0 : 1, {
        duration: MOTION.keyboardMs,
      });
      setKeyboardUp(hidden);
    };
    const showSub = Keyboard.addListener('keyboardDidShow', () => move(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => move(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardY, keyboardOpacity]);

  const motion = useBottomBarMotion();
  const routeKeys = state.routes.map(route => route.key);
  const activeIndex = state.index;

  const commitSelection = useCallback(
    (routeKey: string) => {
      if (!mountedRef.current) {
        return;
      }
      const route = state.routes.find(item => item.key === routeKey);
      if (!route) {
        if (geometry) {
          motion.snapTo(geometry, state.index, 'restore');
        }
        return;
      }
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (geometry) {
        if (event.defaultPrevented) {
          // Bị chặn: capsule quay về tab active thực tế (NAV-13).
          motion.snapTo(geometry, state.index, 'restore');
        } else {
          motion.snapTo(
            geometry,
            state.routes.findIndex(item => item.key === routeKey),
            'snap',
          );
        }
      }
      if (
        !event.defaultPrevented &&
        route.key !== state.routes[state.index]?.key
      ) {
        lastCommitIndexRef.current = state.routes.findIndex(item =>
          item.key === routeKey,
        );
        navigation.navigate(route.name);
      }
    },
    [state, navigation, geometry, motion],
  );

  const gesture = useBottomBarGesture({
    routeKeys,
    motion,
    geometry,
    activeIndex,
    commitSelection,
  });

  // Capsule phải phản ánh navigation state: lần đầu/rotation → placeAt ngay
  // (NAV-01/15); đổi tab do commit → đã có snap animation, bỏ qua; đổi từ
  // ngoài (back/deep link) → cancel preview + placeAt (NAV-14).
  useEffect(() => {
    if (!geometry) {
      return;
    }
    if (lastCommitIndexRef.current === state.index) {
      lastCommitIndexRef.current = null;
      return;
    }
    gesture.cancelPreview(state.index);
    motion.placeAt(geometry, state.index);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.index, geometry]);

  const keyboardStyle = useAnimatedStyle(() => ({
    transform: [{translateY: keyboardY.value}],
    opacity: keyboardOpacity.value,
  }));

  const onBarLayout = useCallback(
    (width: number) => {
      setGeometry({
        barWidth: width,
        padding: MOTION.barPadding,
        tabCount: state.routes.length,
      });
    },
    [state.routes.length],
  );

  const shadowStyle = Platform.select({
    ios: {
      shadowColor: '#2F2F2F',
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: isDark ? 0.45 : 0.05,
      shadowRadius: 16,
    },
    android: {
      elevation: 55,
    },
  });

  return (
    <Animated.View
      testID="bottom-bar"
      onLayout={event => onBarLayout(event.nativeEvent.layout.width)}
      style={[
        styles.bar,
        {
          height: MOTION.barHeight,
          bottom: Math.max(insets.bottom, MOTION.bottomGap),
          marginHorizontal: tokens.space.md,
          borderRadius: tokens.borderRadius.big,
          backgroundColor: colors.tabBar.background,
          borderColor: colors.tabBar.border,
        },
        shadowStyle,
        keyboardStyle,
      ]}>
      <View pointerEvents={keyboardUp ? 'none' : 'auto'} style={styles.fill}>
        <GestureDetector gesture={gesture.composed}>
          <View style={styles.fill}>
            {geometry && (
              <SlidingIndicator
                edgeLeft={motion.edgeLeft}
                edgeRight={motion.edgeRight}
                opacity={motion.capsuleOpacity}
                geometry={geometry}
                top={MOTION.barPadding}
                height={MOTION.capsuleHeight}
                color={colors.tabBar.indicator}
              />
            )}
            {state.routes.map((route, index) => {
              const options = descriptors[route.key]?.options;
              const icon = iconComponent(
                options?.tabBarIcon?.({
                  focused: state.index === index,
                  color: '',
                  size: MOTION.iconSize,
                }),
              );
              return (
                <BottomBarItem
                  key={route.key}
                  label={
                    options?.tabBarAccessibilityLabel ??
                    t(`tab.${route.name.toLowerCase()}`)
                  }
                  selected={state.index === index}
                  Icon={icon}
                  scale={motion.iconScales[index]}
                  onActivate={() => gesture.selectTab(route.key)}
                />
              );
            })}
          </View>
        </GestureDetector>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderWidth: StyleSheet.hairlineWidth,
  },
  fill: {
    flex: 1,
    flexDirection: 'row',
    // Geometry-coupled: capsule top/pill alignment depends on this exact
    // padding matching MOTION.barPadding — exempt from spacing tokens.
    padding: MOTION.barPadding,
  },
});
```

**Ghi chú khi viết thật:** nếu eslint flag `react-hooks/exhaustive-deps` trên effect đồng bộ state (deps `[state.index, geometry]` cố ý không gồm gesture/motion vì chúng ổn định), giữ `// eslint-disable-next-line react-hooks/exhaustive-deps` như trong code.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/AnimatedBottomBar.test.tsx`
Expected: PASS (SlidingIndicator + BottomBarItem + 3 test mới)

- [ ] **Step 5: Quality gates + commit**

Run: `npx tsc --noEmit && npm test && npm run lint`
Expected: sạch (BottomNavigator cũ chưa mount AnimatedBottomBar — UI app chưa đổi)

```bash
git add src/app/navigation/components/AnimatedBottomBar.tsx __tests__/AnimatedBottomBar.test.tsx
git commit -m "feat(navigation): assemble animated bottom bar with keyboard hide"
```

---

### Task 8: Wire BottomNavigator + cập nhật test cũ + nghiệm thu

**Files:**
- Modify: `src/app/navigation/BottomNavigator.tsx`
- Modify: `__tests__/BottomNavigator.test.tsx`
- Verify: checklist NAV-01→20 (motion spec mục 10) trên thiết bị

**Interfaces:**
- Consumes: `AnimatedBottomBar` (Task 7). Giữ nguyên `BottomTabParamList` (types.ts) và 4 `Tab.Screen`.
- Produces: app chạy bar mới; `BottomTabParamList` không đổi; `initialRouteName="Home"` giữ nguyên.

- [ ] **Step 1: Update the failing test first**

Sửa `__tests__/BottomNavigator.test.tsx` — thay toàn bộ nội dung bằng (mock RNGH + haptic copy từ Task 7):

```tsx
import 'react-native';
import React from 'react';
import renderer, {ReactTestRenderer} from 'react-test-renderer';
import {NavigationContainer} from '@react-navigation/native';
import '@/core/i18n';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
  clear: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);

jest.mock('react-native-gesture-handler', () => {
  const RN = require('react-native');
  const chainable = () => {
    const g: Record<string, unknown> = {};
    [
      'maxDuration',
      'maxDeltaX',
      'maxDeltaY',
      'maxDistance',
      'onStart',
      'onUpdate',
      'onEnd',
      'onFinalize',
      'onTouchesDown',
      'onTouchesUp',
      'shouldCancelWhenOutside',
      'enabled',
    ].forEach(method => {
      g[method] = () => g;
    });
    return g;
  };
  return {
    Gesture: {
      Tap: chainable,
      LongPress: chainable,
      Exclusive: (...gestures: unknown[]) => gestures[0],
    },
    GestureDetector: (props: {children: React.ReactNode}) => (
      <RN.View>{props.children}</RN.View>
    ),
    runOnJS: (fn: unknown) => fn,
  };
});

jest.mock('react-native-haptic-feedback', () => ({
  default: {trigger: jest.fn()},
}));

jest.mock('@/features/home', () => ({
  HomeScreen: () => null,
}));
jest.mock('@/features/automation', () => ({
  AutomationScreen: () => null,
}));
jest.mock('@/features/service', () => ({
  ServiceScreen: () => null,
}));
jest.mock('@/features/store', () => ({
  StoreScreen: () => null,
}));

import {ThemeProvider} from '@/core/theme';
import {FTheme} from '@/core/theme/FTheme';
import {BottomNavigator} from '@/app/navigation/BottomNavigator';

describe('BottomNavigator', () => {
  it('renders 4 tab icons at 26x26 with tabBar themed colors', async () => {
    let tree!: ReactTestRenderer;
    await renderer.act(async () => {
      tree = renderer.create(
        <ThemeProvider>
          <NavigationContainer>
            <BottomNavigator />
          </NavigationContainer>
        </ThemeProvider>,
      );
    });

    const svgIcons = tree.root.findAllByType('SvgMock' as any);
    expect(svgIcons.length).toBe(8); // 4 tabs × active + inactive

    svgIcons.forEach(icon => {
      expect(icon.props.width).toBe(26);
      expect(icon.props.height).toBe(26);
    });

    const colors = svgIcons.map(icon => icon.props.color);
    expect(colors).toContain(FTheme.colors.tabBar.iconActive);
    expect(colors).toContain(FTheme.colors.tabBar.iconInactive);
  });

  it('has exactly one selected tab and mounts the sliding indicator', async () => {
    let tree!: ReactTestRenderer;
    await renderer.act(async () => {
      tree = renderer.create(
        <ThemeProvider>
          <NavigationContainer>
            <BottomNavigator />
          </NavigationContainer>
        </ThemeProvider>,
      );
    });

    const tabs = tree.root.findAllByProps({accessibilityRole: 'tab'});
    expect(tabs).toHaveLength(4);
    const selected = tabs.filter(
      tab => tab.props.accessibilityState.selected === true,
    );
    expect(selected).toHaveLength(1);
    expect(selected[0].props.accessibilityLabel).toBe('Trang chủ');

    // Kích hoạt onLayout thủ công vì react-test-renderer không đo layout.
    const bar = tree.root.findByProps({testID: 'bottom-bar'});
    renderer.act(() => {
      bar.props.onLayout({nativeEvent: {layout: {width: 364}}});
    });
    expect(tree.root.findByProps({testID: 'sliding-indicator'})).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest __tests__/BottomNavigator.test.tsx`
Expected: FAIL — bar cũ: icon 28, không có role `tab`/`sliding-indicator`

- [ ] **Step 3: Rewrite BottomNavigator.tsx**

```tsx
import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import type {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import {useTranslation} from 'react-i18next';

import {useTheme} from '@/core/theme';
import {HomeScreen} from '@/features/home';
import {AutomationScreen} from '@/features/automation';
import {ServiceScreen} from '@/features/service';
import {StoreScreen} from '@/features/store';

import {AnimatedBottomBar} from './components/AnimatedBottomBar';

import HomeSvg from '@/assets/svg/navigation/home.svg';
import AutomationSvg from '@/assets/svg/navigation/automation.svg';
import ServiceSvg from '@/assets/svg/navigation/service.svg';
import StoreSvg from '@/assets/svg/navigation/store.svg';

import {BottomTabParamList} from './types';

const Tab = createBottomTabNavigator<BottomTabParamList>();

const ICON_SIZE = 26;

// Module-level render prop — tránh react/no-unstable-nested-components.
const renderTabBar = (props: BottomTabBarProps) => (
  <AnimatedBottomBar {...props} />
);

export const BottomNavigator: React.FC = () => {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const {colors} = theme;

  return (
    <Tab.Navigator
      initialRouteName="Home"
      tabBar={renderTabBar}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.tabBar.iconActive,
        tabBarInactiveTintColor: colors.tabBar.iconInactive,
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarAccessibilityLabel: t('tab.home'),
          tabBarIcon: ({color}) => (
            <HomeSvg width={ICON_SIZE} height={ICON_SIZE} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Automation"
        component={AutomationScreen}
        options={{
          tabBarAccessibilityLabel: t('tab.automation'),
          tabBarIcon: ({color}) => (
            <AutomationSvg width={ICON_SIZE} height={ICON_SIZE} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Service"
        component={ServiceScreen}
        options={{
          tabBarAccessibilityLabel: t('tab.service'),
          tabBarIcon: ({color}) => (
            <ServiceSvg width={ICON_SIZE} height={ICON_SIZE} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Store"
        component={StoreScreen}
        options={{
          tabBarAccessibilityLabel: t('tab.store'),
          tabBarIcon: ({color}) => (
            <StoreSvg width={ICON_SIZE} height={ICON_SIZE} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default BottomNavigator;
```

Ghi chú khi viết thật: file này **không còn** `Platform`/`StyleSheet`/`styles`/`shadowStyle`/`useSafeAreaInsets`/`PlatformPressable`/`tabBarStyle`/`tabBarButton`/`tabBarItemStyle`/`tabBarIconStyle` — custom tabBar tự render toàn bộ. Nếu lint báo unused import thì xóa.

- [ ] **Step 4: Run all tests + gates**

Run: `npx tsc --noEmit && npm test && npm run lint && npm run check:arch`
Expected: tất cả PASS / 0 error. (Nếu `App.test.tsx` vỡ vì bar mới dùng reanimated thật — thêm mock reanimated theo pattern `jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'))` chỉ trong file test đó.)

- [ ] **Step 5: Manual device verification (bảng NAV trong motion spec mục 10)**

Build release trên thiết bị/simulator:

```bash
npx react-native run-ios --configuration Release
npm run android   # assembleRelease qua gradle nếu cần
```

Duyệt checklist NAV-01→20; tối thiểu: NAV-01→05 (tap/capsule/trung gian), NAV-06→12 (preview/drag/hysteresis/ngoài vùng/vuốt sớm), NAV-13/16/20 (preventDefault/hai ngón/tap ma), NAV-15 (keyboard ẩn bar), NAV-17/18 (screen reader, Reduce Motion), NAV-19 (profile screen nặng). Tune thông số trong `bottomBarMotion.ts` theo cảm nhận video, không sửa logic.

- [ ] **Step 6: Commit**

```bash
git add src/app/navigation/BottomNavigator.tsx __tests__/BottomNavigator.test.tsx
git commit -m "feat(navigation): mount animated bottom bar in tab navigator"
```

---

## Self-review checklist (đã chạy khi viết plan)

- Spec coverage: layout 3.2 (Task 1 config + Task 7 bar), màu 3.3 (Task 2), Flow A (Task 6 tap + Task 5 spring), Flow B (Task 6 longPress), sơ đồ trạng thái mục 6 (phase enum), motion mục 7 (MOTION + motion hook), commit 8.5 (commitSelection), render/hiệu năng 8.6 (translate/scale only, keyboard, hit area cố định), a11y mục 9 (Task 4 + selectTab + Reduce Motion), NAV-01→20 (Task 8 bước 5).
- Không placeholder: mọi code step có code hoàn chỉnh; 2 chú thích "dọn khi viết thật" là chỉ dẫn sửa lỗi cụ thể, không phải TBD.
- Type consistency: `BarGeometry`/`MOTION`/`BottomBarMotionApi`/`BottomBarGestureApi` dùng nhất quán qua các task; SlidingIndicator nhận `edgeLeft/edgeRight` (không centerX/halfWidth) ở mọi nơi nhắc đến.


