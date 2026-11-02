# OtpScreen Layout Redesign — Design Doc

Date: 2026-09-16
Status: Approved

## Goal

Restyle `src/features/auth/presentation/screens/OtpScreen.tsx` to match the approved mock:

- OTP boxes: filled = green border + green digit; empty = grey `-` placeholder.
- Resend row split into two ends: left = countdown/resend link, right = "Đã gửi tới +84 987 ••• 011".
- Disabled "Tiếp tục" button rendered as a solid grey pill (not opacity-faded green).

## Non-Goals

- No custom in-screen numeric keypad — the hidden `TextInput` + system keyboard mechanism is kept.
- No new shared components (`FOtpInput` skipped — single usage, YAGNI).
- No changes to OTP request/verify logic, countdown, navigation, or i18n keys.

## Changes

### 1. OtpScreen.tsx (in place)

Section order:

```
container (white, flex 1)
├── wave absolute bottom 60% (unchanged)
├── FAppbar back (unchanged)
└── KeyboardAwareScrollView keyboardShouldPersistTaps="handled" (unchanged)
    ├── FLoading
    ├── Title "Nhập mã Xác thực" (unchanged position/style)
    ├── 6 OTP boxes (TouchableOpacity + hidden TextInput unchanged)
    │     filled: digit in colors.primary, border colors.primary
    │     empty:  "-" in colors.placeHolder, border colors.grey2
    ├── Row space-between, paddingHorizontal 16
    │     left:  "Gửi lại sau {n}s" (grey, bodyText2) | "Gửi lại mã" (green, buttonText2)
    │     right: "Đã gửi tới {maskedPhone}" (grey, bodyText2)
    └── FFilledButton "Tiếp tục" (disabled when otp.length < 6)
```

- `sentTo` text moves from below the title to the right side of the resend row.
- Active-box border highlight state removed; only filled/empty states remain.

### 2. Phone mask

`0987123011` (10 digits, leading 0) → `+84 987 ••• 011`:

```
+84 ${phoneNumber.slice(1, 4)} ••• ${phoneNumber.slice(-3)}
```

Fallback to the current `slice(0, 3) ••• slice(-3)` mask for other formats.

### 3. FFilledButton.tsx (shared change)

When `disabled`: `backgroundColor: colors.disable`, `textColor: colors.body`; remove the `opacity: 0.5` treatment. Applies to all screens using this button — intentional, keeps disabled styling consistent app-wide.

## Behavior — unchanged

Hidden TextInput entry, `useResendCountdown`, `requestOtp`/`verifyOtp` via `useAuth`, error snackbar with Vietnamese-substring contracts, `KeyboardAwareScrollView` handling, navigation reset to `BottomNavigation`.

## Testing

- Update/extend OtpScreen render test with `react-test-renderer` (mock inline per repo convention).
- FFilledButton disabled-style render check.
- Gates: `npx tsc --noEmit`, `npm test`, `npm run lint`.
