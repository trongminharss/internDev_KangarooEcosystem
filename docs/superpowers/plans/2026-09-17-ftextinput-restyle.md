# FTextInput Pill Restyle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle `FTextInput` to the approved mock: flat placeholder-only pill inputs with default / focused / error / disabled states.

**Architecture:** Drop react-native-paper's `TextInput` (its floating-label machinery is dead weight once the label is gone) in favor of a plain RN `TextInput` inside the existing wrapper. Spec: `docs/superpowers/specs/2026-09-17-ftextinput-restyle-design.md`.

**Tech Stack:** React Native 0.87, TypeScript, react-test-renderer 19, Jest 29 (`@react-native/jest-preset`).

**Verified facts (do not re-check):**

- `tokens.borderRadius.full` = 999 (`src/shared/styles/tokens.ts:21`).
- Theme colors used all exist on `ColorsProps`: `border1`, `primary`, `error`, `white`, `grey1`, `disable`, `placeHolder`, `label`, `primaryBorder`.
- `useTheme()` context default is `FTheme` (light) — tests render without a provider and assert against `FTheme.colors.*` (same pattern as `__tests__/FButton.test.tsx`).
- Tests live in root `__tests__/`, no jest setup file, mocks inline.
- Quality gates: `npx tsc --noEmit`, `npm test`, `npm run lint`.
- Package manager is npm. Commit format: `type(scope): lowercase imperative summary`.

---

### Task 1: Pill radius in FInputSize

**Files:**

- Modify: `src/shared/styles/FInputSize.tsx:12-23`

- [ ] **Step 1: Change both borderRadius values to 999**

```tsx
const FInputSize: CustomInputSize = {
  size48: {
    height: 48,
    borderRadius: 999,
    padding: 12,
  },
  size56: {
    height: 56,
    borderRadius: 999,
    padding: 10,
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add src/shared/styles/FInputSize.tsx
git commit -m "refactor(shared): full pill radius for input sizes"
```

---

### Task 2: Write the failing test

**Files:**

- Test: `__tests__/FTextInput.test.tsx` (create)

- [ ] **Step 1: Write the test file**

```tsx
import 'react-native';
import React from 'react';
import {StyleSheet, TextInput, ViewStyle} from 'react-native';
import renderer, {ReactTestRenderer} from 'react-test-renderer';

import FTextInput from '@/shared/components/FTextInput';
import FTheme from '@/core/theme/FTheme';

const renderInput = async (
  props: Partial<React.ComponentProps<typeof FTextInput>> = {},
) => {
  let tree!: ReactTestRenderer;
  await renderer.act(async () => {
    tree = renderer.create(
      <FTextInput
        placeholder="Nhập tên"
        value=""
        onChangeText={() => {}}
        onClear={() => {}}
        {...props}
      />,
    );
  });
  return tree;
};

const containerStyle = (tree: ReactTestRenderer): ViewStyle =>
  StyleSheet.flatten(
    tree.root.findByProps({testID: 'f-text-input-container'}).props.style,
  ) as ViewStyle;

const input = (tree: ReactTestRenderer) => tree.root.findByType(TextInput);

describe('FTextInput', () => {
  it('default: border1 border, white background, pill radius, placeholder', async () => {
    const tree = await renderInput();
    expect(containerStyle(tree).borderColor).toBe(FTheme.colors.border1);
    expect(containerStyle(tree).backgroundColor).toBe(FTheme.colors.white);
    expect(containerStyle(tree).borderRadius).toBe(999);
    expect(input(tree).props.placeholder).toBe('Nhập tên');
    expect(input(tree).props.placeholderTextColor).toBe(
      FTheme.colors.placeHolder,
    );
  });

  it('focus toggles border to primary and back', async () => {
    const tree = await renderInput({value: 'giá trị'});
    await renderer.act(async () => {
      input(tree).props.onFocus();
    });
    expect(containerStyle(tree).borderColor).toBe(FTheme.colors.primary);
    await renderer.act(async () => {
      input(tree).props.onBlur();
    });
    expect(containerStyle(tree).borderColor).toBe(FTheme.colors.border1);
  });

  it('error: error border and red helper text', async () => {
    const tree = await renderInput({
      value: 'abc',
      errorText: 'Email không hợp lệ',
    });
    expect(containerStyle(tree).borderColor).toBe(FTheme.colors.error);
    expect(
      tree.root.findByProps({children: 'Email không hợp lệ'}),
    ).toBeTruthy();
  });

  it('disabled: grey1 background, not editable, disable colors', async () => {
    const tree = await renderInput({disabled: true});
    expect(containerStyle(tree).backgroundColor).toBe(FTheme.colors.grey1);
    expect(input(tree).props.editable).toBe(false);
    expect(input(tree).props.placeholderTextColor).toBe(FTheme.colors.disable);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest __tests__/FTextInput.test.tsx`
Expected: FAIL — no `testID: 'f-text-input-container'` found (component has no `placeholder`/`disabled` props yet).

---

### Task 3: Rewrite FTextInput + update call sites

**Files:**

- Modify: `src/shared/components/FTextInput.tsx` (full rewrite)
- Modify: `src/features/home/presentation/components/InputsSection.tsx` (4× `label=` → `placeholder=`)
- Modify: `src/features/auth/presentation/screens/PhoneLoginScreen.tsx:134` (`label=` → `placeholder=`)

- [ ] **Step 1: Replace FTextInput.tsx with the RN-TextInput version**

```tsx
import React from 'react';
import {
  ViewStyle,
  TextStyle,
  View,
  KeyboardTypeOptions,
  Platform,
  TouchableOpacity,
  TextInput as RNTextInput,
  TextInputInstance,
} from 'react-native';
import {FInputSizeProps} from '../styles/FInputSize';
import FInputSize from '../styles/FInputSize';
import FTheme from '@/core/theme/FTheme';
import {useTheme} from '@/core/theme';
import FIconButton from './FIconButton';
import FText from './FText';
import {FFilled} from '../styles/FIconStyles';
import {tokens} from '@/shared/styles';

interface FTextInputProps {
  readonly?: boolean;
  placeholder: string;
  value: string;
  rightIcon?: React.ReactNode;
  onFocus?: () => void;
  onClear: () => void;
  onPressIn?: () => void;
  onChangeText: (text: string) => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: FInputSizeProps;
  errorText?: string;
  secureTextEntry?: boolean;
  showHelperButton?: boolean;
  helperButton?: React.ReactNode;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters' | undefined;
  inputRef?: React.MutableRefObject<TextInputInstance | null>;
  disabled?: boolean;
}

const FTextInput: React.FC<FTextInputProps> = ({
  readonly = false,
  placeholder,
  value,
  onFocus,
  onClear,
  onChangeText,
  onPressIn,
  style,
  rightIcon,
  size = FInputSize.size56,
  textStyle = FTheme.fonts.body02,
  errorText,
  secureTextEntry = false,
  showHelperButton = false,
  helperButton,
  keyboardType = 'default',
  autoCapitalize,
  inputRef,
  disabled = false,
}) => {
  const {theme} = useTheme();
  const {colors} = theme;
  const [isFocused, setIsFocused] = React.useState(false);
  const borderColor = errorText
    ? colors.error
    : isFocused
    ? colors.primary
    : colors.border1;
  const backgroundColor = disabled ? colors.grey1 : colors.white;
  const textColor = disabled ? colors.disable : colors.label;
  const buildClearIcon = (
    <View style={{width: rightIcon ? 36 : null}}>
      <FIconButton
        icon={FFilled.c_remove}
        size={16}
        onPress={() => {
          if (onClear) onClear();
        }}
      />
    </View>
  );
  return (
    <TouchableOpacity
      onPress={readonly ? onPressIn : undefined}
      disabled={!readonly || disabled}>
      <View pointerEvents={readonly ? 'none' : undefined}>
        <View
          testID="f-text-input-container"
          style={[
            {
              width: '100%',
              borderRadius: size.borderRadius,
              flexDirection: 'row',
              borderWidth: 1,
              alignItems: 'center',
              backgroundColor,
              borderColor,
            },
            style,
          ]}>
          <RNTextInput
            ref={inputRef}
            placeholder={placeholder}
            placeholderTextColor={
              disabled ? colors.disable : colors.placeHolder
            }
            onFocus={() => {
              if (onFocus) onFocus();
              setIsFocused(true);
            }}
            keyboardType={keyboardType}
            onBlur={() => {
              setIsFocused(false);
            }}
            style={{
              flex: 1,
              height: size.height,
              backgroundColor,
              color: textColor,
              fontSize: textStyle.fontSize,
              fontWeight: textStyle.fontWeight,
              paddingHorizontal: size.padding,
            }}
            value={value}
            autoCapitalize={autoCapitalize}
            cursorColor={colors.label}
            onChangeText={onChangeText}
            onPressIn={() => {
              if (onPressIn) onPressIn();
            }}
            secureTextEntry={secureTextEntry}
            editable={!disabled}
            selectionColor={
              Platform.OS == 'ios' ? colors.primary : colors.primaryBorder
            }
          />
          {readonly
            ? buildClearIcon
            : isFocused && value?.trim()?.length > 0
            ? buildClearIcon
            : null}
          {rightIcon ? rightIcon : null}
        </View>
        {errorText?.trim() !== '' || showHelperButton == true ? (
          <View
            style={{
              flexDirection: 'row',
            }}>
            <FText
              style={{
                flex: 1,
                color: colors.error,
                paddingTop: helperButton
                  ? tokens.spacing.xs
                  : tokens.spacing._2xs,
              }}
              typo="subtitle3">
              {errorText}
            </FText>
            {helperButton}
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

export default FTextInput;
```

Notes (already applied above, do not re-add):

- `label` prop renamed to `placeholder`; paper's floating label, underline props, and `theme.colors` config are gone.
- Dead code removed: `value = ''` in clear-icon `onPress` (prop assignment was a no-op; `onClear` resets state at the call site) and `value = text` in `onChangeText`.
- Text input pill radius comes from `size.borderRadius` (999 after Task 1).

- [ ] **Step 2: Update InputsSection.tsx — rename `label=` to `placeholder=` on all four FTextInput usages**

Lines 15, 21, 35, 44: `label="Họ tên"` → `placeholder="Họ tên"`, `label="Mật khẩu"` → `placeholder="Mật khẩu"`, `label="Email"` → `placeholder="Email"`, `label="Chọn ngày"` → `placeholder="Chọn ngày"`.

- [ ] **Step 3: Update PhoneLoginScreen.tsx:134**

`label={t('auth.enterPhone')}` → `placeholder={t('auth.enterPhone')}`

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest __tests__/FTextInput.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors. If a `label=` call site was missed, tsc reports it — fix by renaming that call site.

- [ ] **Step 6: Commit**

```bash
git add src/shared/components/FTextInput.tsx src/features/home/presentation/components/InputsSection.tsx src/features/auth/presentation/screens/PhoneLoginScreen.tsx __tests__/FTextInput.test.tsx
git commit -m "feat(shared): restyle ftextinput to flat placeholder pill with disabled state"
```

---

### Task 4: Full quality gates

- [ ] **Step 1: Run all gates**

Run: `npm test && npm run lint`
Expected: all tests pass, no lint errors (HomeScreen.test.tsx renders InputsSection, so it exercises the renamed props end-to-end).

- [ ] **Step 2: Fix and commit anything remaining**

If gates surfaced fixes, commit them with the same style: `fix(shared): <what>`. Otherwise done.
