# Onboarding Intro (First Launch) — Design

Date: 2026-09-15
Status: Approved

## Goal

Show a 3-slide onboarding intro the first time the app is launched. Slides are
swipeable; a bottom bar has Skip (left), 3 dots indicator (center), Back + Next
(right). After Skip or finishing the last slide, the app marks onboarding as
seen and routes to Login. On every later launch the intro is skipped.

## Flow & Navigation

```
Splash (2s) ── reads KEY_FIRST_LOAD ──┬─ null/true  → replace('Onboarding')
                                      └─ false      → replace('Login')

Onboarding ── Skip, or Next on last slide ──> Storage.set(KEY_FIRST_LOAD, false)
                                              → replace('Login')
```

- This also fixes an existing bug: `SplashScreen` currently reads
  `KEY_FIRST_LOAD` but ignores the value and always routes to `Login`.
- New route `Onboarding: undefined` in `RootStackParamList`
  (`src/app/navigation/types.ts`), registered in `RootNavigator.tsx` with
  `headerShown: false, animation: 'fade'`.
- `LoginUseCase`'s existing `setIsFirstLoad(false)` call stays untouched.
- The placeholder `FirstLoadScreen` is deleted: screen file, its export in
  `features/auth/index.ts`, and the `FirstLoad` route in types +
  `RootNavigator`. No tests reference it; the now-unused `firstLoad` block is
  removed from both locale files.

## Feature Structure

Presentation-only feature (same as `home`/`account`; it uses the `Storage`
utility directly, same precedent as `SplashScreen`):

```
src/features/onboarding/
  presentation/screens/OnboardingScreen.tsx
  index.ts                     → exports OnboardingScreen
```

No domain, data layer, Redux, or thunks — the only side effect is writing one
storage flag.

## Screen Design

- **Carousel**: horizontal `ScrollView` with `pagingEnabled`; a `ref` calls
  `scrollTo` for the Next/Back buttons; `onMomentumScrollEnd` updates `index`
  when the user swipes. Single piece of state: `index` (0–2).
- **Slide layout**: logo SVG (`@/assets/svg/logo.svg`, sized like Splash) +
  `FText` title (typography token `headline6`, 30/36) + subtitle (token
  `body01`, 18/28).
- **Bottom bar** (one row): `Skip` text button (left) — 3 dots (center, active
  dot larger/darker per `index`) — `Back` + `Next` (right). `Back` is disabled
  on slide 1. `Next` keeps the label "Tiếp" on the last slide; pressing it
  finishes onboarding.
- Colors come from `useTheme()` (dark-mode safe); styles follow the
  `createStyles(colors)` factory pattern.

## Content & i18n

New flow → add keys to both `vi.json` and `en.json` under `onboarding`:
`skip`, `back`, `next`, and `slide1`/`slide2`/`slide3` each with `title` and
`subtitle`. Vietnamese copy (source of truth):

1. "Một ứng dụng, trọn hệ sinh thái" / "Kết nối và quản lý các thiết bị
   Kangaroo trong cùng một ứng dụng."
2. "Điều khiển mọi lúc, mọi nơi" / "Theo dõi trạng thái, điều khiển thiết bị
   và nhận thông báo ngay trên điện thoại."
3. "An tâm cùng Kangaroo" / "Theo dõi thiết bị, nhận cảnh báo và sử dụng dịch
   vụ chăm sóc chính hãng trong suốt vòng đời sản phẩm."

Slides are a const array in the screen mapped through `t()`. English
translations are added to `en.json` alongside.

## Testing

- `OnboardingScreen.test.tsx` (react-test-renderer): renders 3 slides and 3
  dots; pressing Next advances the active dot; Skip writes
  `Storage.setItem(KEY_FIRST_LOAD, false)` and calls
  `navigation.replace('Login')`. Mocks are declared inline with `jest.mock()`
  (`@react-navigation` hook + `Storage`).
- Update `__tests__/App.test.tsx` mock block if the new route affects the App
  tree (verify while implementing).
- Quality gates before commit: `npx tsc --noEmit`, `npm test`,
  `npm run lint`.

## Non-Goals

- No illustrations/images (logo SVG is a placeholder; real artwork can be
  swapped in later).
- No pager dependency (`react-native-pager-view`) — `ScrollView pagingEnabled`
  is enough for 3 static slides.
- No retry/analytics hooks.
