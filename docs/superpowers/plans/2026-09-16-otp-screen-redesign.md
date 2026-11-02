# OtpScreen Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle `OtpScreen` to match the approved mock (green filled OTP boxes with `-` placeholders, split resend/sent-to row, grey disabled button).

**Architecture:** In-place edits to one screen + one shared button component. No new components, no logic changes (hidden `TextInput` + system keyboard kept, countdown/verify flow untouched).

**Tech Stack:** React Native 0.87, react-test-renderer 19, Jest 29 (`@react-native/jest-preset`).

**Spec:** `docs/superpowers/specs/2026-09-16-otp-screen-redesign-design.md`

---

### Task 1: FFilledButton solid-grey disabled state

**Files:**

- Modify: `src/shared/components/FFilledButton.tsx`
- Test: `src/shared/components/FFilledButton.test.tsx` (create)

- [ ] **Step 1: Write the failing test**

Create `src/shared/components/FFilledButton.test.tsx`:

```tsx
import 'react-native';
import React from 'react';
import {StyleSheet, Text, TouchableOpacity, ViewStyle} from 'react-native';
import renderer, {ReactTestRenderer} from 'react-test-renderer';

import FFilledButton from './FFilledButton';
import FTheme from './FTheme';

const renderButton = async (disabled?: boolean) => {
  let tree!: ReactTestRenderer;
  await renderer.act(async () => {
    tree = renderer.create(
      <FFilledButton title="Tiếp tục" onPress={() => {}} disabled={disabled} />,
    );
  });
  return tree;
};

const buttonStyle = (tree: ReactTestRenderer): ViewStyle => {
  const button = tree.root.findByType(TouchableOpacity);
  return StyleSheet.flatten(button.props.style) as ViewStyle;
};

describe('FFilledButton', () => {
  it('enabled uses primary background and white text', async () => {
    const tree = await renderButton(false);
    expect(buttonStyle(tree).backgroundColor).toBe(FTheme.colors.primary);
    const text = tree.root.findByType(Text);
    expect(StyleSheet.flatten(text.props.style)!.color).toBe(
      FTheme.colors.white,
    );
  });

  it('disabled renders solid grey pill without opacity fade', async () => {
    const tree = await renderButton(true);
    expect(buttonStyle(tree).backgroundColor).toBe(FTheme.colors.disable);
    expect(buttonStyle(tree).opacity).toBeUndefined();
    const text = tree.root.findByType(Text);
    expect(StyleSheet.flatten(text.props.style)!.color).toBe(
      FTheme.colors.body,
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/shared/components/FFilledButton.test.tsx`
Expected: FAIL — disabled case gets `backgroundColor: FTheme.colors.primary` and `opacity: 0.5`.

- [ ] **Step 3: Implement the disabled style**

In `src/shared/components/FFilledButton.tsx`, replace:

```tsx
const bgColor = backgroundColor ?? colors.primary;
const fgColor = textColor ?? colors.white;
```

with:

```tsx
const bgColor = disabled ? colors.disable : backgroundColor ?? colors.primary;
const fgColor = disabled ? colors.body : textColor ?? colors.white;
```

and delete this line from the `TouchableOpacity` style array:

```tsx
        disabled && {opacity: 0.5},
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/shared/components/FFilledButton.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/shared/components/FFilledButton.tsx src/shared/components/FFilledButton.test.tsx
git commit -m "feat(ui): solid grey disabled state for FFilledButton"
```

---

### Task 2: OtpScreen layout restyle

**Files:**

- Modify: `src/features/auth/presentation/screens/OtpScreen.tsx`
- Test: `src/features/auth/presentation/screens/OtpScreen.test.tsx` (create)

- [ ] **Step 1: Write the failing test**

Create `src/features/auth/presentation/screens/OtpScreen.test.tsx`:

```tsx
import 'react-native';
import '@/core/i18n';
import React from 'react';
import {Text} from 'react-native';
import renderer, {ReactTestInstance} from 'react-test-renderer';

const mockGoBack = jest.fn();

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
    useFrameCallback: () => ({setActive: jest.fn(), isActive: false}),
    useReducedMotion: () => false,
  };
});

jest.mock('react-native-keyboard-aware-scroll-view', () => {
  const {createElement} = require('react');
  const {View} = require('react-native');
  return {
    __esModule: true,
    KeyboardAwareScrollView: (props: any) =>
      createElement(View, {
        keyboardShouldPersistTaps: props.keyboardShouldPersistTaps,
      }),
  };
});

jest.mock('../../../../app/navigation/types', () => ({
  useAppNavigation: () => ({goBack: mockGoBack, reset: jest.fn()}),
}));

jest.mock('../../../../shared/hooks/useSnackbar', () => ({
  useFSnackbar: () => ({showSnackbar: jest.fn(), hideSnackbar: jest.fn()}),
}));

jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    requestOtp: jest.fn(),
    verifyOtp: jest.fn(),
    isLoading: false,
  }),
}));

jest.mock('../hooks/useResendCountdown', () => ({
  useResendCountdown: () => ({
    seconds: 30,
    canResend: false,
    restart: jest.fn(),
  }),
}));

jest.mock('../../../../core/theme', () => {
  const actual = jest.requireActual('../../../../core/theme');
  return {
    ...actual,
    useTheme: () => ({
      theme: actual.FTheme,
      isDark: false,
      mode: 'light',
      setMode: jest.fn(),
    }),
  };
});

import {useRoute} from '@react-navigation/native';
import {OtpScreen} from './OtpScreen';

jest.mocked(useRoute).mockReturnValue({
  params: {phoneNumber: '0987123011'},
} as any);

const collectTexts = (root: ReactTestInstance): string[] => {
  const out: string[] = [];
  const walk = (node: any) => {
    if (typeof node === 'string' || typeof node === 'number') {
      out.push(String(node));
      return;
    }
    if (Array.isArray(node)) {
      node.forEach(walk);
    }
  };
  root.findAllByType(Text).forEach(t => walk(t.props.children));
  return out;
};

describe('OtpScreen', () => {
  it('renders title, masked phone in the resend row and 6 empty dash boxes', async () => {
    let tree!: ReactTestRenderer;
    await renderer.act(async () => {
      tree = renderer.create(<OtpScreen />);
    });

    const texts = collectTexts(tree.root);
    expect(texts).toContain('Nhập mã Xác thực');
    expect(
      texts.some(
        s => s.includes('Đã gửi tới') && s.includes('+84 987 ••• 011'),
      ),
    ).toBe(true);
    expect(texts).toContain('Gửi lại sau 30s');
    expect(texts.filter(s => s === '-')).toHaveLength(6);
  });
});
```

Note: `useRoute` is imported from the real `@react-navigation/native` (only `useAppNavigation` is mocked), so we stub its return with `jest.mocked(useRoute).mockReturnValue(...)`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/features/auth/presentation/screens/OtpScreen.test.tsx`
Expected: FAIL — phone renders as `098•••011` above the boxes (not `+84 987 ••• 011` in the resend row) and there are no `-` placeholders.

- [ ] **Step 3: Implement the screen changes**

Rewrite the JSX body of `src/features/auth/presentation/screens/OtpScreen.tsx` (all imports unchanged except deleting nothing — every import stays). Replace the `maskedPhone` computation:

```tsx
const maskedPhone =
  phoneNumber.length === 10 && phoneNumber.startsWith('0')
    ? `+84 ${phoneNumber.slice(1, 4)} ••• ${phoneNumber.slice(-3)}`
    : phoneNumber.length >= 6
    ? `${phoneNumber.slice(0, 3)}•••${phoneNumber.slice(-3)}`
    : phoneNumber;
```

Replace the `sentTo` text block (currently between title and boxes):

```tsx
<FText typo="bodyText2" style={styles.sentTo}>
  {`${t('auth.otpSentTo')} ${maskedPhone}`}
</FText>
```

— delete it entirely (the text moves into the resend row below).

Replace the box map inside `styles.otpRow`:

```tsx
{
  Array.from({length: 6}).map((_, i) => {
    const digit = otp[i] ?? '';
    const isFilled = digit.length > 0;
    return (
      <View key={i} style={[styles.otpBox, isFilled && styles.otpBoxFilled]}>
        <FText
          typo="title3"
          style={isFilled ? styles.digitFilled : styles.digitEmpty}>
          {isFilled ? digit : '-'}
        </FText>
      </View>
    );
  });
}
```

(drops the `isActive` variable and the inline `isActive && {borderColor: colors.primary}` override).

Replace the whole `resendRow` block with:

```tsx
<View style={styles.resendRow}>
  {canResend ? (
    <TouchableOpacity onPress={handleResend}>
      <FText typo="buttonText2" style={styles.resendLink}>
        {t('auth.resend')}
      </FText>
    </TouchableOpacity>
  ) : (
    <FText typo="bodyText2" style={styles.mutedText}>
      {t('auth.resendAfter', {seconds})}
    </FText>
  )}
  <FText typo="bodyText2" style={styles.mutedText}>
    {`${t('auth.otpSentTo')} ${maskedPhone}`}
  </FText>
</View>
```

Update the button margin:

```tsx
<FFilledButton
  title={t('auth.continue')}
  onPress={handleContinue}
  disabled={otp.length < 6 || isLoading}
  style={{marginHorizontal: 16, marginTop: 40}}
/>
```

Update `createStyles` — remove the old `sentTo` style, change `resendRow`, add four styles:

```tsx
    sentTo: {
      color: colors.subtitle,
      paddingHorizontal: 16,
      paddingBottom: 32,
    },
```

→ deleted.

```tsx
    resendRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 24,
    },
    resendLink: {
      color: colors.primary,
    },
    mutedText: {
      color: colors.subtitle,
    },
    otpBoxFilled: {
      borderColor: colors.primary,
    },
    digitFilled: {
      color: colors.primary,
    },
    digitEmpty: {
      color: colors.placeHolder,
    },
```

(`otpBox` keeps `borderColor: colors.grey2`; `largeTitle`, `boxesTouch`, `otpRow`, `hiddenInput` unchanged.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/features/auth/presentation/screens/OtpScreen.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/auth/presentation/screens/OtpScreen.tsx src/features/auth/presentation/screens/OtpScreen.test.tsx
git commit -m "feat(auth): restyle otp screen per mock layout"
```

---

### Task 3: Quality gates

- [ ] **Step 1: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 2: Full test suite**

Run: `npm test`
Expected: all pass (existing suites unaffected — FFilledButton change only alters disabled visuals).

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 4: Fix anything the gates surface, then final commit if needed**

```bash
git add -A
git commit -m "fix(auth): address lint/type findings from otp restyle"
```

(Skip if gates are clean.)
