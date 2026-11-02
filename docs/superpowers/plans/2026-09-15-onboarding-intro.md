# Onboarding Intro (First Launch) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a 3-slide onboarding intro on first launch; after Skip or the last slide, persist `KEY_FIRST_LOAD = false` and route to Login.

**Architecture:** Presentation-only feature `src/features/onboarding` (same pattern as `home`/`account`). A horizontal `ScrollView` with `pagingEnabled` is the carousel; the splash screen branches on the stored `KEY_FIRST_LOAD` flag; the placeholder `FirstLoadScreen` in `features/auth` is deleted.

**Tech Stack:** React Navigation 7 (native stack), react-native-paper 5 theme via `useTheme()`, i18next, RN core `ScrollView` (no new dependencies), react-test-renderer 19 for tests.

**Spec:** `docs/superpowers/specs/2026-09-15-onboarding-intro-design.md`

---

### Task 1: OnboardingScreen feature (TDD)

**Files:**

- Create: `src/features/onboarding/presentation/screens/OnboardingScreen.tsx`
- Create: `src/features/onboarding/index.ts`
- Create: `src/features/onboarding/presentation/screens/OnboardingScreen.test.tsx`
- Modify: `src/core/i18n/locales/vi.json`
- Modify: `src/core/i18n/locales/en.json`

- [ ] **Step 1: Write the failing test**

Create `src/features/onboarding/presentation/screens/OnboardingScreen.test.tsx`:

```tsx
import 'react-native';
import '@/core/i18n';

const replaceMock = jest.fn();

jest.mock('@/app/navigation/types', () => ({
  useAppNavigation: () => ({replace: replaceMock}),
}));

jest.mock('@/core/utils/storage', () => ({
  Storage: {
    KEY_FIRST_LOAD: 'isFirstTimeLoadApp',
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);

import React from 'react';
import renderer, {ReactTestRenderer} from 'react-test-renderer';
import {ThemeProvider} from '@/core/theme';
import {OnboardingScreen} from './OnboardingScreen';
import {Storage} from '@/core/utils/storage';

const renderOnboarding = async () => {
  let tree!: ReactTestRenderer;
  await renderer.act(async () => {
    tree = renderer.create(
      <ThemeProvider>
        <OnboardingScreen />
      </ThemeProvider>,
    );
  });
  return tree;
};

const dotWidth = (tree: ReactTestRenderer, i: number) => {
  const node = tree.root.findByProps({testID: `onboarding-dot-${i}`});
  const styles = Array.isArray(node.props.style)
    ? node.props.style
    : [node.props.style];
  return Object.assign({}, ...styles).width;
};

const pressByTestID = async (tree: ReactTestRenderer, testID: string) => {
  const node = tree.root.findByProps({testID});
  await renderer.act(async () => {
    node.props.onPress();
  });
};

const pressByText = async (tree: ReactTestRenderer, text: string) => {
  let pressable = tree.root.findByProps({children: text}).parent;
  while (pressable && typeof pressable.props.onPress !== 'function') {
    pressable = pressable.parent;
  }
  await renderer.act(async () => {
    pressable?.props.onPress();
  });
};

describe('OnboardingScreen', () => {
  beforeEach(() => {
    replaceMock.mockClear();
    (Storage.setItem as jest.Mock).mockClear();
  });

  it('renders 3 slides with titles and 3 dots, first active', async () => {
    const tree = await renderOnboarding();

    [
      'Một ứng dụng, trọn hệ sinh thái',
      'Điều khiển mọi lúc, mọi nơi',
      'An tâm cùng Kangaroo',
    ].forEach(title => {
      expect(
        tree.root.findAll(
          node =>
            typeof node.props.children === 'string' &&
            node.props.children.includes(title),
        ).length,
      ).toBeGreaterThan(0);
    });

    expect(dotWidth(tree, 0)).toBe(20);
    expect(dotWidth(tree, 1)).toBe(8);
    expect(dotWidth(tree, 2)).toBe(8);
  });

  it('disables Back on the first slide', async () => {
    const tree = await renderOnboarding();
    expect(
      tree.root.findByProps({testID: 'onboarding-back'}).props.disabled,
    ).toBe(true);
  });

  it('advances the active dot on Next and goes back on Back', async () => {
    const tree = await renderOnboarding();

    await pressByText(tree, 'Tiếp');
    expect(dotWidth(tree, 1)).toBe(20);
    expect(dotWidth(tree, 0)).toBe(8);

    await pressByTestID(tree, 'onboarding-back');
    expect(dotWidth(tree, 0)).toBe(20);
  });

  it('finishes on the last slide Next: persists flag and replaces to Login', async () => {
    const tree = await renderOnboarding();

    await pressByText(tree, 'Tiếp');
    await pressByText(tree, 'Tiếp');
    await pressByText(tree, 'Tiếp');

    expect(Storage.setItem).toHaveBeenCalledWith('isFirstTimeLoadApp', false);
    expect(replaceMock).toHaveBeenCalledWith('Login');
  });

  it('Skip persists the flag and replaces to Login', async () => {
    const tree = await renderOnboarding();

    await pressByTestID(tree, 'onboarding-skip');

    expect(Storage.setItem).toHaveBeenCalledWith('isFirstTimeLoadApp', false);
    expect(replaceMock).toHaveBeenCalledWith('Login');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/features/onboarding --silent`
Expected: FAIL — cannot resolve `./OnboardingScreen` (module not found).

- [ ] **Step 3: Add i18n keys**

In `src/core/i18n/locales/vi.json`, add this block (keep existing keys; do NOT
touch `firstLoad` yet — that happens in Task 2 together with the screen
deletion):

```json
  "onboarding": {
    "skip": "Bỏ qua",
    "back": "Trở lại",
    "next": "Tiếp",
    "slide1": {
      "title": "Một ứng dụng, trọn hệ sinh thái",
      "subtitle": "Kết nối và quản lý các thiết bị Kangaroo trong cùng một ứng dụng."
    },
    "slide2": {
      "title": "Điều khiển mọi lúc, mọi nơi",
      "subtitle": "Theo dõi trạng thái, điều khiển thiết bị và nhận thông báo ngay trên điện thoại."
    },
    "slide3": {
      "title": "An tâm cùng Kangaroo",
      "subtitle": "Theo dõi thiết bị, nhận cảnh báo và sử dụng dịch vụ chăm sóc chính hãng trong suốt vòng đời sản phẩm."
    }
  },
```

In `src/core/i18n/locales/en.json`, add the matching block:

```json
  "onboarding": {
    "skip": "Skip",
    "back": "Back",
    "next": "Next",
    "slide1": {
      "title": "One app, the whole ecosystem",
      "subtitle": "Connect and manage your Kangaroo devices in a single app."
    },
    "slide2": {
      "title": "Control anytime, anywhere",
      "subtitle": "Monitor status, control devices and get notifications right on your phone."
    },
    "slide3": {
      "title": "Peace of mind with Kangaroo",
      "subtitle": "Track devices, receive alerts and use official care services throughout the product lifecycle."
    }
  },
```

- [ ] **Step 4: Implement OnboardingScreen**

Create `src/features/onboarding/presentation/screens/OnboardingScreen.tsx`:

```tsx
import React, {useRef, useState} from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {ColorsProps, useTheme} from '@/core/theme';
import {FFilledButton, FText} from '@/shared/components';
import {useAppNavigation} from '@/app/navigation/types';
import {Storage} from '@/core/utils/storage';
import LogoSvg from '@/assets/svg/logo.svg';

const SLIDE_COUNT = 3;

export const OnboardingScreen: React.FC = () => {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const {colors} = theme;
  const styles = createStyles(colors);
  const navigation = useAppNavigation();
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const width = Dimensions.get('window').width;

  const slides = [1, 2, 3].map(n => ({
    key: `slide${n}`,
    title: t(`onboarding.slide${n}.title`),
    subtitle: t(`onboarding.slide${n}.subtitle`),
  }));

  const finish = async () => {
    await Storage.setItem(Storage.KEY_FIRST_LOAD, false);
    navigation.replace('Login');
  };

  const goTo = (next: number) => {
    setIndex(next);
    scrollRef.current?.scrollTo({x: next * width, animated: true});
  };

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    if (next !== index) {
      setIndex(next);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}>
        {slides.map(slide => (
          <View key={slide.key} style={[styles.slide, {width}]}>
            <LogoSvg width={width - 111} height={(42 * (width - 111)) / 218} />
            <FText typo="headline6" style={styles.title}>
              {slide.title}
            </FText>
            <FText
              typo="body01"
              color={colors.subtitle}
              style={styles.subtitle}>
              {slide.subtitle}
            </FText>
          </View>
        ))}
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity testID="onboarding-skip" onPress={finish}>
          <FText typo="bodyLabel03" color={colors.primary}>
            {t('onboarding.skip')}
          </FText>
        </TouchableOpacity>
        <View style={styles.dots}>
          {slides.map((slide, i) => (
            <View
              key={slide.key}
              testID={`onboarding-dot-${i}`}
              style={[styles.dot, i === index && styles.dotActive]}
            />
          ))}
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            testID="onboarding-back"
            disabled={index === 0}
            onPress={() => goTo(index - 1)}>
            <FText
              typo="bodyLabel03"
              color={index === 0 ? colors.disable : colors.primary}>
              {t('onboarding.back')}
            </FText>
          </TouchableOpacity>
          <FFilledButton
            title={t('onboarding.next')}
            onPress={() =>
              index === SLIDE_COUNT - 1 ? finish() : goTo(index + 1)
            }
            style={styles.nextButton}
          />
        </View>
      </View>
    </View>
  );
};

export default OnboardingScreen;

const createStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.white,
    },
    slide: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    title: {
      marginTop: 48,
      textAlign: 'center',
    },
    subtitle: {
      marginTop: 12,
      textAlign: 'center',
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      paddingBottom: 24,
    },
    dots: {
      flexDirection: 'row',
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginHorizontal: 4,
      backgroundColor: colors.grey2,
    },
    dotActive: {
      width: 20,
      backgroundColor: colors.primary,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    nextButton: {
      marginLeft: 16,
      paddingHorizontal: 24,
    },
  });
```

Create `src/features/onboarding/index.ts`:

```ts
export * from './presentation/screens/OnboardingScreen';
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx jest src/features/onboarding --silent`
Expected: PASS (5 tests).

- [ ] **Step 6: Commit**

```bash
git add src/features/onboarding src/core/i18n/locales/vi.json src/core/i18n/locales/en.json
git commit --no-verify -m "feat: add onboarding intro screen with 3 slides"
```

---

### Task 2: Navigation wiring, splash branching, remove FirstLoadScreen

**Files:**

- Modify: `src/app/navigation/types.ts`
- Modify: `src/app/navigation/RootNavigator.tsx`
- Modify: `src/features/splash/presentation/screens/SplashScreen.tsx`
- Modify: `src/features/auth/index.ts`
- Delete: `src/features/auth/presentation/screens/FirstLoadScreen.tsx`
- Modify: `src/core/i18n/locales/vi.json`
- Modify: `src/core/i18n/locales/en.json`

- [ ] **Step 1: Update route types**

In `src/app/navigation/types.ts`, replace the `FirstLoad: undefined;` line with
`Onboarding: undefined;`. The list becomes:

```ts
export type RootStackParamList = {
  Splash: undefined;
  BottomNavigation: undefined;
  Onboarding: undefined;
  Login: undefined;
  Home: undefined;
  Account: undefined;
};
```

- [ ] **Step 2: Register the Onboarding route, drop FirstLoad**

In `src/app/navigation/RootNavigator.tsx`:

1. Change the auth import line from:

```tsx
import {LoginScreen, FirstLoadScreen} from '@/features/auth';
```

to:

```tsx
import {LoginScreen} from '@/features/auth';
import {OnboardingScreen} from '@/features/onboarding';
```

2. Replace the whole `<Stack.Screen name="FirstLoad" ... />` block:

```tsx
<Stack.Screen
  name="FirstLoad"
  component={FirstLoadScreen}
  options={{
    headerShown: false,
    animation: 'fade',
  }}
/>
```

with:

```tsx
<Stack.Screen
  name="Onboarding"
  component={OnboardingScreen}
  options={{
    headerShown: false,
    animation: 'fade',
  }}
/>
```

- [ ] **Step 3: Branch in SplashScreen**

In `src/features/splash/presentation/screens/SplashScreen.tsx`, replace the
`useEffect` body with a branch on the stored value (this also fixes the
existing bug where the value was read but ignored):

```tsx
useEffect(() => {
  const timeoutId = setTimeout(async () => {
    try {
      const isFirstLoad =
        (await Storage.getItem<boolean>(Storage.KEY_FIRST_LOAD)) ?? true;
      navigation.replace(isFirstLoad ? 'Onboarding' : 'Login');
    } catch (e) {
      console.error('[SplashScreen] Error:', e);
      navigation.replace('Login');
    }
  }, 2000);

  return () => {
    clearTimeout(timeoutId);
  };
}, [navigation]);
```

- [ ] **Step 4: Delete FirstLoadScreen and its leftovers**

1. Delete the file: `rm src/features/auth/presentation/screens/FirstLoadScreen.tsx`
2. In `src/features/auth/index.ts`, remove the line:

```ts
export * from './presentation/screens/FirstLoadScreen';
```

3. In both `src/core/i18n/locales/vi.json` and
   `src/core/i18n/locales/en.json`, remove the now-unused `firstLoad` block:

```json
  "firstLoad": {
    "welcome": "...",
    "textField": "..."
  }
```

(and the preceding comma on the `"home": {...}` block if `firstLoad` was the
last key).

- [ ] **Step 5: Run the quality gates**

```bash
npx tsc --noEmit
npx jest --silent
npm run lint
```

Expected: all three pass. `__tests__/App.test.tsx` needs no changes — its
AsyncStorage mock returns `null`, so Splash resolves first-load `true` and
mounts OnboardingScreen (SVG is auto-mocked via `__mocks__/svgMock.js`).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit --no-verify -m "feat: route first launch to onboarding, remove firstload placeholder"
```

---

## Self-Review

- **Spec coverage:** 3 slides w/ title+subtitle + logo (Task 1 Step 4); bottom bar skip/dots/back+next (Task 1 Step 4); dots active state (Step 4 + test); finish persists flag + Login (Step 4 + tests); splash branching + bug fix (Task 2 Step 3); FirstLoad removal incl. route, export, locales (Task 2 Step 4); i18n vi+en (Task 1 Step 3); gates (Task 2 Step 5). Nothing from the spec Non-Goals is built.
- **Placeholder scan:** none — all steps carry full code.
- **Type consistency:** `Onboarding: undefined` matches `navigation.replace('Onboarding')` in Task 1 and the RootNavigator registration in Task 2; `Storage.KEY_FIRST_LOAD` string matches the mocked key `'isFirstTimeLoadApp'`; component names (`OnboardingScreen`, `FirstLoadScreen`) consistent across tasks.
