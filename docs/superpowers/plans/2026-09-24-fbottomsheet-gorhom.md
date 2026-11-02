# FBottomSheet Rebuild on @gorhom/bottom-sheet — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `FBottomSheet` on `@gorhom/bottom-sheet@5.2.x` as a thin imperative wrapper (`ref.present()`/`ref.dismiss()`), migrate its 2 call sites, and rewrite its tests against the package's official mock.

**Architecture:** `BottomSheetModal`-based wrapper that forwards the raw modal ref, applies theme defaults (backdrop, background, handle indicator), and re-implements Android back-to-close (the package has none). Provider mounted once in `AppProviders`. Spec: `docs/superpowers/specs/2026-09-24-fbottomsheet-gorhom-design.md`.

**Tech Stack:** React Native 0.87, TypeScript, `@gorhom/bottom-sheet@^5.2.14` (pure JS — no pod install), react-native-reanimated 4.6 (already installed), react-native-gesture-handler 3.2 (already installed), jest + react-test-renderer.

**Key research facts (verified against v5.2.14 source):**
- No `borderRadius` prop on the sheet in v5 — corner radius goes in `backgroundStyle` (default background is `borderRadius: 15, backgroundColor: 'white'`; our `backgroundStyle` merges after it).
- `BottomSheetBackdrop` hardcodes black but merges caller `style` after it → pass `style={{backgroundColor: colors.title}}`.
- `enablePanDownToClose` defaults to `false` → wrapper sets `true`.
- `enableDynamicSizing` defaults to `true` → content-sized sheets, no snapPoints needed except the terms sheet.
- No `BackHandler` usage anywhere in the package → wrapper owns back-to-close via internal `isOpen` state.
- Types exported from the package index: `BottomSheetModalProps`, `BottomSheetBackdropProps`.
- `backdropComponent?: React.FC<BottomSheetBackdropProps>` — exact callback signature for our `renderBackdrop`.

---

### Task 1: Install the package and mount the provider

**Files:**
- Modify: `package.json` (via npm install)
- Modify: `src/app/providers/AppProviders.tsx`

- [ ] **Step 1: Install the package**

```bash
npm install @gorhom/bottom-sheet@^5.2.14
```

Expected: added 1 package, no peer-dep errors (`.npmrc` sets `legacy-peer-deps=true`). This is a pure-JS package — do NOT run `pod install`, do NOT create a patch.

- [ ] **Step 2: Verify the dependency landed**

```bash
node -e "console.log(require('./package.json').dependencies['@gorhom/bottom-sheet'])"
```

Expected: `^5.2.14`.

- [ ] **Step 3: Mount `BottomSheetModalProvider` in AppProviders**

In `src/app/providers/AppProviders.tsx`, add the import next to the other library imports:

```tsx
import {BottomSheetModalProvider} from '@gorhom/bottom-sheet';
```

Wrap the inner tree, directly inside `GestureHandlerRootView` (bottom sheets need the gesture root above them; existing provider order stays untouched):

```tsx
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <BottomSheetModalProvider>
        <ReduxProvider store={store}>
          <ThemeProvider>
            <MenuProvider>
              <ThemedPaperProvider>
                <FSnackbarProvider>{children}</FSnackbarProvider>
              </ThemedPaperProvider>
            </MenuProvider>
          </ThemeProvider>
        </ReduxProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
```

(One closing `</BottomSheetModalProvider>` before `</GestureHandlerRootView>`; adjust indentation, nothing else changes.)

- [ ] **Step 4: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/app/providers/AppProviders.tsx
git commit -m "feat(ui): add @gorhom/bottom-sheet and mount BottomSheetModalProvider"
```

---

### Task 2: Rewrite the FBottomSheet test (failing first)

**Files:**
- Modify: `__tests__/FBottomSheet.test.tsx` (full rewrite)

- [ ] **Step 1: Replace the test file with the new suite**

Delete the entire current content of `__tests__/FBottomSheet.test.tsx` and write:

```tsx
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
    expect(spy).toHaveBeenCalledWith(
      'hardwareBackPress',
      expect.any(Function),
    );
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
```

Notes for the implementer:
- The official mock (`@gorhom/bottom-sheet/mock`) provides a class-based `BottomSheetModal` whose `render()` returns children; `ref.current` becomes a real class instance whose `props` we poke to simulate `onChange`/`onDismiss`. That is why the swipe/backdrop/loading tests from the old suite are gone — gorhom owns those now.
- `BottomSheetBackdrop: () => null` guards against the official mock's `BottomSheetBackdrop = NOOP` (returns `undefined`, which React rejects) if it ever renders.
- The AsyncStorage mock stays: `ThemeProvider` hydration needs it.

- [ ] **Step 2: Run the new suite to verify it fails**

```bash
npx jest __tests__/FBottomSheet.test.tsx
```

Expected: FAIL — the current component does not import `@gorhom/bottom-sheet` and does not export `FBottomSheetRef` (TypeScript/type or runtime failure; e.g. cannot find `FBottomSheetRef`, or old reanimated-based implementation crashing under the slim mock). Any failure caused by the old implementation is fine — this is the red state.

---

### Task 3: Rewrite FBottomSheet on BottomSheetModal

**Files:**
- Modify: `src/shared/components/FBottomSheet.tsx` (full rewrite)
- Modify: `src/shared/components/index.ts` (add named type export)

- [ ] **Step 1: Replace the component file**

Delete the entire current content of `src/shared/components/FBottomSheet.tsx` and write:

```tsx
import React, {forwardRef, useCallback, useEffect, useState} from 'react';
import {BackHandler, StyleSheet} from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  type BottomSheetBackdropProps,
  type BottomSheetModalProps,
} from '@gorhom/bottom-sheet';
import {ColorsProps, useTheme} from '@/core/theme';
import {tokens} from '@/shared/styles';

export type FBottomSheetRef = BottomSheetModal;

export interface FBottomSheetProps extends BottomSheetModalProps {
  onClose?: () => void;
}

const FBottomSheet = forwardRef<FBottomSheetRef, FBottomSheetProps>(
  (
    {
      onClose,
      enablePanDownToClose = true,
      enableDynamicSizing = true,
      backdropComponent,
      backgroundStyle,
      handleIndicatorStyle,
      onChange,
      children,
      ...props
    },
    ref,
  ) => {
    const {theme} = useTheme();
    const {colors} = theme;
    const styles = createStyles(colors);
    const [isOpen, setIsOpen] = useState(false);

    const handleChange = useCallback(
      (index: number) => {
        setIsOpen(index >= 0);
        onChange?.(index);
      },
      [onChange],
    );

    const handleDismiss = useCallback(() => {
      setIsOpen(false);
      onClose?.();
    }, [onClose]);

    useEffect(() => {
      if (!isOpen) {
        return;
      }
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        ref.current?.dismiss();
        return true;
      });
      return () => sub.remove();
    }, [isOpen, ref]);

    const renderBackdrop = useCallback(
      (p: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...p}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.8}
          pressBehavior="close"
          style={styles.backdrop}
        />
      ),
      [styles],
    );

    return (
      <BottomSheetModal
        ref={ref}
        {...props}
        enablePanDownToClose={enablePanDownToClose}
        enableDynamicSizing={enableDynamicSizing}
        backgroundStyle={[styles.background, backgroundStyle]}
        handleIndicatorStyle={[styles.indicator, handleIndicatorStyle]}
        backdropComponent={backdropComponent ?? renderBackdrop}
        onChange={handleChange}
        onDismiss={handleDismiss}>
        {children}
      </BottomSheetModal>
    );
  },
);

export default FBottomSheet;

const createStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    backdrop: {
      backgroundColor: colors.title,
    },
    background: {
      backgroundColor: colors.white,
      borderRadius: tokens.borderRadius.big,
    },
    indicator: {
      width: 40,
      height: 4,
      backgroundColor: colors.bgDarkBase,
      borderRadius: tokens.borderRadius.full,
    },
  });
```

Design points (why each default is here):
- v5 has no `borderRadius` prop — the corner radius lives in `backgroundStyle` (replaces the package default of 15).
- `enablePanDownToClose = true` restores the current swipe-down-to-close UX (package default is `false`).
- `BottomSheetBackdrop` with `pressBehavior="close"` gives backdrop tap-to-close; `style={styles.backdrop}` overrides its hardcoded black with the themed `colors.title`; `opacity={0.8}` matches the old `BACKDROP_OPACITY`.
- The `BackHandler` effect only registers while `isOpen`, so normal back navigation is never swallowed when no sheet is open.
- `handleChange` forwards a caller-supplied `onChange` — the wrapper never silently drops gorhom props.

- [ ] **Step 2: Export the ref type from the barrel**

In `src/shared/components/index.ts`, change line 2 from:

```ts
export {default as FBottomSheet} from './FBottomSheet';
```

to:

```ts
export {default as FBottomSheet} from './FBottomSheet';
export type {FBottomSheetRef} from './FBottomSheet';
```

- [ ] **Step 3: Run the suite to verify it passes**

```bash
npx jest __tests__/FBottomSheet.test.tsx
```

Expected: 5 passed.

- [ ] **Step 4: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors. (If TS complains that `onChange`'s 3-param signature conflicts with `handleChange`'s 1-param, it won't — fewer parameters are always assignable — but if any other type friction appears, fix it inside this file only.)

- [ ] **Step 5: Commit**

```bash
git add src/shared/components/FBottomSheet.tsx src/shared/components/index.ts __tests__/FBottomSheet.test.tsx
git commit -m "refactor(ui): rebuild fbottomsheet on @gorhom/bottom-sheet"
```

---

### Task 4: Migrate FAppbar (language sheet)

**Files:**
- Modify: `src/shared/components/FAppbar.tsx`

- [ ] **Step 1: Switch imports and replace state with a ref**

Line 1 — `useState` is no longer used, `useRef` is:

```tsx
import React, {useRef} from 'react';
```

Line 13 — import the ref type:

```tsx
import FBottomSheet, {FBottomSheetRef} from './FBottomSheet';
```

Line 61 — replace:

```tsx
  const [isSheetVisible, setIsSheetVisible] = useState(false);
```

with:

```tsx
  const languageSheetRef = useRef<FBottomSheetRef>(null);
```

- [ ] **Step 2: Present the sheet imperatively**

Replace the `handleLanguagePress` body:

```tsx
  const handleLanguagePress = () => {
    if (onLanguagePress) {
      onLanguagePress();
    } else {
      languageSheetRef.current?.present();
    }
  };
```

- [ ] **Step 3: Rewire the sheet JSX**

Replace the sheet opening tag block (currently lines 130–134):

```tsx
      {isLanguageVisible && (
        <FBottomSheet
          isVisible={isSheetVisible}
          closeModal={() => setIsSheetVisible(false)}
          style={{width: '100%'}}>
```

with:

```tsx
      {isLanguageVisible && (
        <FBottomSheet ref={languageSheetRef}>
```

(The `style={{width: '100%'}}` is dropped — the modal portal is full-width. Children stay untouched.)

- [ ] **Step 4: Dismiss on language select**

Replace inside the language row's `onPress` (currently lines 157–160):

```tsx
                  onPress={() => {
                    setLanguage(option.code);
                    setIsSheetVisible(false);
                  }}>
```

with:

```tsx
                  onPress={() => {
                    setLanguage(option.code);
                    languageSheetRef.current?.dismiss();
                  }}>
```

- [ ] **Step 5: Typecheck and lint the file**

```bash
npx tsc --noEmit && npx eslint src/shared/components/FAppbar.tsx
```

Expected: clean (`useState` import removal verified by tsc; no unused vars by eslint).

- [ ] **Step 6: Commit**

```bash
git add src/shared/components/FAppbar.tsx
git commit -m "refactor(ui): use imperative fbottomsheet ref in fappbar"
```

---

### Task 5: Migrate PhoneLoginScreen (terms sheet)

**Files:**
- Modify: `src/features/auth/presentation/screens/PhoneLoginScreen.tsx`

- [ ] **Step 1: Replace state with a ref**

Line 49 — replace:

```tsx
  const [sheetVisible, setSheetVisible] = useState(false);
```

with:

```tsx
  const termsSheetRef = useRef<FBottomSheetRef>(null);
```

(`useRef` is already imported on line 11.)

- [ ] **Step 2: Present the sheet imperatively**

Replace `openTermsSheet` (currently lines 120–123):

```tsx
  const openTermsSheet = () => {
    Keyboard.dismiss();
    termsSheetRef.current?.present();
  };
```

- [ ] **Step 3: Rewire the sheet JSX**

Replace the sheet opening tag block (currently lines 226–229):

```tsx
      <FBottomSheet
        isVisible={sheetVisible}
        closeModal={() => setSheetVisible(false)}
        style={styles.sheet}>
```

with:

```tsx
      <FBottomSheet
        ref={termsSheetRef}
        snapPoints={['88%']}
        enableDynamicSizing={false}>
```

(Review amendment: `enableDynamicSizing={false}` is required — with the
wrapper's dynamic-sizing default on, `snapPoints` are effectively ignored and
a content-derived detent gets pushed into the snap list.)

(The old `styles.sheet` set `height: '88%'`; gorhom expresses that as a snap point. The `flex: 1` `ScrollView` inside fills the sheet.)

- [ ] **Step 4: Dismiss on agree**

Replace the agree button's `onPress` (currently lines 240–243):

```tsx
          onPress={() => {
            setSheetVisible(false);
            toggleAgreedTerms(true);
          }}
```

with:

```tsx
          onPress={() => {
            termsSheetRef.current?.dismiss();
            toggleAgreedTerms(true);
          }}
```

- [ ] **Step 5: Delete the dead `styles.sheet` entry**

In `createStyles` (currently lines 301–304), remove:

```tsx
    sheet: {
      height: '88%',
      justifyContent: 'flex-start',
    },
```

`sheetTitle` and `sheetContent` stay.

- [ ] **Step 6: Import the ref type**

Line 22 imports `FBottomSheet` from the barrel. Below it (keeping alphabetical order in that import list is not required — same statement is fine), extend to:

```tsx
import {
  FAppbar,
  FBottomSheet,
  FBottomSheetRef,
  FButton,
  FCheckbox,
  FLoading,
  FText,
  FTextInput,
  WaterWaveBubblesBackground,
} from '@/shared/components';
```

- [ ] **Step 7: Typecheck and lint the file**

```bash
npx tsc --noEmit && npx eslint src/features/auth/presentation/screens/PhoneLoginScreen.tsx
```

Expected: clean — no unused `useState`/`sheetVisible` references remain.

- [ ] **Step 8: Commit**

```bash
git add src/features/auth/presentation/screens/PhoneLoginScreen.tsx
git commit -m "refactor(auth): use imperative fbottomsheet ref in phone login"
```

---

### Task 6: Full quality gates

**Files:**
- Modify (conditional): `jest.config.js`

- [ ] **Step 1: Run the whole test suite**

```bash
npm test
```

Expected: all suites pass, including the rewritten `FBottomSheet.test.tsx` and both screen suites that render `FAppbar`/`PhoneLoginScreen` (they mock `@gorhom/bottom-sheet`? No — if screen tests render the real package they will import the ESM/CJS build; if jest throws a syntax/transform error mentioning `@gorhom/bottom-sheet`, extend the existing `transformIgnorePatterns` group in `jest.config.js` — add `@gorhom/bottom-sheet` into the same parenthesized list, do NOT add a second entry):

```js
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|immer|@reduxjs/toolkit|@react-native-async-storage|react-redux|@react-navigation|react-native-worklets|react-native-reanimated|react-native-modal|@gorhom/bottom-sheet)/)',
  ],
```

If screen tests fail because `BottomSheetModal` requires a provider or touch real reanimated worklets, add an inline `jest.mock('@gorhom/bottom-sheet', () => require('@gorhom/bottom-sheet/mock'))` at the top of those test files (repo rule: per-test-file inline mocks).

- [ ] **Step 2: Lint everything**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 3: Architecture check**

```bash
npm run check:arch
```

Expected: no boundary violations (all touched files are presentation/shared — no data-layer imports introduced).

- [ ] **Step 4: Final typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit any config/test adaptations (only if something changed)**

```bash
git add -A
git commit -m "test: adapt suite config for @gorhom/bottom-sheet"
```

If nothing changed, skip this step.

- [ ] **Step 6: Report manual smoke-test checklist to the user**

Cannot be automated here — hand to the user:
1. FAppbar flag button opens the language sheet; selecting a language closes it.
2. PhoneLogin terms link opens the terms sheet (keyboard dismisses first); Agree closes it and ticks the checkbox.
3. Each sheet closes via swipe-down, backdrop tap, and Android hardware back.
4. With no sheet open, Android back navigates normally (no swallowed presses).
5. Dark mode: backdrop and sheet colors follow the theme.
