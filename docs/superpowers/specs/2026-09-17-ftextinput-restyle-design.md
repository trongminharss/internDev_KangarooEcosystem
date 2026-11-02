# FTextInput Restyle — Pill Design

Date: 2026-09-17
Status: Approved

## Goal

Restyle `src/shared/components/FTextInput.tsx` to match the approved mock: flat placeholder-only pill inputs with distinct default / focused / filled / error / disabled states. No floating label.

## Decisions

- **Placeholder-only.** The floating label is removed entirely. The existing `label` prop is renamed `placeholder` and rendered as static placeholder text. Call sites updated: `InputsSection.tsx` (4 usages), `PhoneLoginScreen.tsx` (1 usage).
- **Plain RN `TextInput`.** react-native-paper's `TextInput` is dropped from this component. Paper's label machinery and border internals were being neutralized with hacks (4-corner radius overrides, 3 underline props, paper theme colors). A plain `TextInput` needs only `placeholder` + `placeholderTextColor`.
- **Clear icon kept.** Existing behavior unchanged: shows when focused with non-empty value, or when `readonly`.
- **Disabled state added** (new `disabled?: boolean` prop, default false) — the mock includes a disabled state the component does not support today.

## Visual Spec

| State    | Border           | Background     | Text / Placeholder                                      |
| -------- | ---------------- | -------------- | ------------------------------------------------------- |
| Default  | `colors.border1` | `colors.white` | placeholder `colors.placeHolder`; text `colors.label`   |
| Focused  | `colors.primary` | `colors.white` | unchanged                                               |
| Error    | `colors.error`   | `colors.white` | helper text row in `colors.error` (existing row kept)   |
| Disabled | `colors.border1` | `colors.grey1` | text + placeholder `colors.disable`; `editable={false}` |

Priority for border color: error > focused > disabled/default.

All colors come from `useTheme()` — no static color imports.

## Shape & Layout

- Pill shape: `FInputSize` size48/size56 `borderRadius` changes from `8` to `tokens.borderRadius.full` (999). Heights stay 48/56; padding unchanged.
- Outer wrapper `View` keeps `flexDirection: 'row'`, `borderWidth: 1`, full width.
- `textStyle` default stays `FTheme.fonts.body02`.
- Selection/cursor colors keep current values (`cursorColor: colors.label`, `selectionColor` per-platform as today).

## API Changes

```ts
interface FTextInputProps {
  placeholder: string; // renamed from `label`
  disabled?: boolean; // new
  // unchanged: readonly, value, rightIcon, onFocus, onClear, onPressIn,
  // onChangeText, style, textStyle, size, errorText, secureTextEntry,
  // showHelperButton, helperButton, keyboardType, autoCapitalize, inputRef
}
```

`disabled` implies: `TouchableOpacity` disabled, `TextInput` `editable={false}`, gray palette per table above.

## Cleanup

- Remove the dead `value = ''` assignment inside the clear-icon `onPress` (assigning to a prop is a no-op; `onClear` at the call site is the real state reset).

## Out of Scope

- No changes to other F-components, theme tokens, or `FInputSize` height/padding.
- No third size variant (the three mock columns are width variations, covered by size48/56 + `style`).

## Testing

New `__tests__/FTextInput.test.tsx` using `react-test-renderer` (repo convention, mocks inline):

1. Default: border `colors.border1`, white background, placeholder rendered.
2. Focus/blur: border toggles to `colors.primary` and back.
3. Error: border `colors.error`, helper text rendered in error color.
4. Disabled: gray background, `editable` false.
5. Pill: outer container borderRadius equals 999.

Quality gates after implementation: `npx tsc --noEmit`, `npm test`, `npm run lint`.
